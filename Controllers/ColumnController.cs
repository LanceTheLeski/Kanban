using Azure.Data.Tables;
using Kanban.Components.DTOs;
using Kanban.Contexts;
using Kanban.Models;
using Kanban.Repositories;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;

namespace Kanban.Controllers;

[ApiController]
[Route ("kanban/columns")]
public class ColumnController : Controller
{
    private const string boards = "Boards";
    private const string columns = "Columns";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _boardTable;
    private readonly TableClient _columnTable;

    private readonly BoardRepository _boardRepository;
    private readonly ColumnRepository _columnRepository;

    public ColumnController (IOptions<CosmosOptions> cosmosOptions, ColumnRepository columnRepository, BoardRepository boardRepository)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _boardTable = _tableServiceClient.GetTableClient (tableName: boards);
        _columnTable = _tableServiceClient.GetTableClient (tableName: columns);

        _boardRepository = boardRepository;
        _columnRepository = columnRepository;
    }

    [HttpGet ("fetch/{ID:guid}")]
    public async Task<ActionResult> FetchColumn (Guid ID)
    {
        var columnList = new List<Column> ();
        var columnsFromTable = _columnTable.QueryAsync<Column> (column => column.PartitionKey == ID.ToString ());
        await foreach (var column in columnsFromTable)
            columnList.Add (column);

        //If multiple boards have the same column then there will be multiple results here. I think we only need to grab the first for now
        if (columnList.Count () is 0)
            return NotFound ("The column you are searching for was not found.");

        var columnToReturn = columnList.First ();
        var columnResponse = new ColumnResponse
        {
            ID = Guid.Parse (columnToReturn.PartitionKey),
            Title = columnToReturn.Title,
            BoardID = Guid.Parse (columnToReturn.RowKey), //Might be an issue later if we need another board's column
            Order = columnToReturn.ColumnOrder
        };
        return Ok (columnResponse);
    }

    [HttpPost ("create")] //We need a standardized Column Order here. Zero-based or One-based?
    public async Task<ActionResult> CreateColumn ([FromBody] ColumnCreateRequest columnCreateRequest)
    {
        if (columnCreateRequest is null)
        {
            return BadRequest ("There was no Column Request passed in!");
        }

        var boardsFromTable = await _boardRepository.QueryBoardsAsync (board => board.PartitionKey == columnCreateRequest.BoardID.ToString ());
        if (boardsFromTable.Count () is 0)
            return BadRequest ("The board ID passed in does not exist.");
        if (boardsFromTable.DistinctBy (board => board.Title).Count () is not 0)
            return BadRequest ("The board ID passed in corresponds to more than one board... somehow?");
        if (columnCreateRequest.Order >= boardsFromTable.Count ())
            return BadRequest ("The order passed in is too high.");

        var newColumnID = Guid.NewGuid ();
        var newColumn = new Column
        {
            PartitionKey = newColumnID.ToString (),
            RowKey = columnCreateRequest.BoardID.ToString (),

            Title = columnCreateRequest.Title,
            ColumnOrder = columnCreateRequest.Order,

            BoardTitle = boardsFromTable.First ().Title
        };

        var addEntityResponse = await _columnTable.AddEntityAsync (newColumn);
        if (addEntityResponse.IsError)
        {
            //We might want to have better verification later for failures. I'm thinking we actually query the table and grab the column so we can map it to a response object
            return StatusCode (StatusCodes.Status500InternalServerError, $"Could not insert a new column into database. Internal status: {addEntityResponse.Status}");
        }

        //If the order is not exactly at the end then we have to update other columns and their board cards

        var columnResponse = new ColumnResponse
        {
            ID = Guid.Parse (newColumn.PartitionKey),
            Title = newColumn.Title,
            BoardID = Guid.Parse (newColumn.RowKey),
            Order = newColumn.ColumnOrder
        };
        return StatusCode (StatusCodes.Status201Created, columnResponse);
    }

    [HttpPatch ("update/{ID:Guid}")]
    public async Task<ActionResult> UpdateColumn (Guid ID, [FromBody] JsonPatchDocument<ColumnPatchRequest> columnPatchRequest)
    {
        if (columnPatchRequest is null)
            return BadRequest ("There was no Patch Request passed in!");

        Column? columnToUpdate = await _columnRepository.GetColumnAsync (columnID: ID, boardID: new Guid (@"20a88077-10d4-4648-92cb-7dc7ba5b8df5"));
        if (columnToUpdate is null)
            return NotFound ("Could not find the desired column for update.");

        if (_columnRepository.TryApplyJsonPatchDocumentToColumn (columnPatchRequest, columnToUpdate, out var convertedColumnToUpdate) is false)
            return BadRequest ("The patch request is invalid.");

        var columnOrderChange = _columnRepository.GetColumnOrderChange (columnToUpdate, convertedColumnToUpdate);

        Collection<Column>? otherColumnsWithUpdatedOrder = null;
        if (columnPatchRequest.Operations.Any (operation => string.Equals (operation.path, $"/{nameof (ColumnPatchRequest.Order)}", StringComparison.OrdinalIgnoreCase))) 
        {
            var columnCollection = await _columnRepository.GetAllColumnsForBoard (boardID: Guid.Parse ("20a88077-10d4-4648-92cb-7dc7ba5b8df5"));
            try
            {
                otherColumnsWithUpdatedOrder = await _columnRepository.UpdateAllOtherColumnOrdersAsync (columnCollection, columnOrderChange.oldOrder, columnOrderChange.newOrder);
            }
            catch (Exception ex)
            {
                return BadRequest (ex);
            }
        }

        columnToUpdate.Title = convertedColumnToUpdate.Title;
        columnToUpdate.ColumnOrder = convertedColumnToUpdate.Order;
        var response = await _columnTable.UpdateEntityAsync (columnToUpdate, Azure.ETag.All);
        if (response.IsError)
        {
            return BadRequest ($"Could not update column. Internal status: {response.Status}");
        }

        if (otherColumnsWithUpdatedOrder is not null)
            otherColumnsWithUpdatedOrder.Add (columnToUpdate);
        var allUpdatedColumns = otherColumnsWithUpdatedOrder ?? new Collection<Column> { columnToUpdate };
        await _columnRepository.UpdateBoardCardsWithNewColumnInfoAsync (allUpdatedColumns);

        var columnResponse = new ColumnResponse
        {
            ID = Guid.Parse (columnToUpdate.PartitionKey),
            Title = columnToUpdate.Title,
            BoardID = Guid.Parse (columnToUpdate.RowKey),
            Order = columnToUpdate.ColumnOrder
        };
        return Ok (columnResponse);
    }

    [HttpDelete ("delete/{ID:guid}")]
    public async Task<ActionResult> DeleteColumn (Guid ID)
    {
        var columnList = new List<Column> ();
        var columnsFromTable = _columnTable.QueryAsync<Column> (column => column.PartitionKey == ID.ToString ());
        await foreach (var column in columnsFromTable)
            columnList.Add (column);

        if (columnList.Count () is 0)
            return NotFound ("The column you are searching for was not found.");

        if (columnList.Count () > 1)
            return StatusCode (StatusCodes.Status500InternalServerError, "Multiple columns were found with the same ID.");

        var columnFromDatabase = columnList.Single ();
        var columnToDelete = _columnTable.DeleteEntityAsync (columnFromDatabase.PartitionKey, columnFromDatabase.RowKey);

        // Move cards to a higher column in a repository method. Call it here.
        await _columnRepository.UpdateBoardCardsWithNewColumnInfoAsync ()

        if (!columnToDelete.IsFaulted)
            return Ok (); //Is there a better Status to return? NoContent perhaps?
        else
            return StatusCode (StatusCodes.Status500InternalServerError, "Could not delete column.");
    }
}