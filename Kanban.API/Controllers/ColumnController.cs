using Azure.Data.Tables;
using Kanban.Contracts.Request.Create;
using Kanban.Contracts.Request.Patch;
using Kanban.Contracts.Response;
using Kanban.API.Models;
using Kanban.API.Options;
using Kanban.API.Repositories;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.JsonPatch.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;

namespace Kanban.API.Controllers;

[ApiController]
[Route ("kanban/columns")]
public class ColumnController : Controller
{
    private const string columns = "Columns";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _columnTable;

    private readonly IBoardRepository _boardRepository;
    private readonly IColumnRepository _columnRepository;

    public ColumnController (IOptions<CosmosOptions> cosmosOptions, 
                             IColumnRepository columnRepository, 
                             IBoardRepository boardRepository)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _columnTable = _tableServiceClient.GetTableClient (tableName: columns);

        _boardRepository = boardRepository;
        _columnRepository = columnRepository;
    }

    [HttpGet ("fetch/{ID:guid}")]
    public async Task<ActionResult> FetchColumn (Guid ID)
    {
        var columnCollection = await _columnRepository.QueryColumnsAsync (column => column.PartitionKey == ID.ToString ());

        //If multiple boards have the same column then there will be multiple results here. I think we only need to grab the first for now
        if (columnCollection.Count () is 0)
            return NotFound ("The column you are searching for was not found.");

        var columnToReturn = columnCollection.First ();
        var columnResponse = new ColumnResponse
        {
            ID = Guid.Parse (columnToReturn.PartitionKey),
            Title = columnToReturn.Title,
            BoardID = Guid.Parse (columnToReturn.RowKey), //Might be an issue later if we need another board's column
            Order = columnToReturn.ColumnOrder
        };
        return Ok (columnResponse);
    }

    [HttpPost ("create")] //We need a standardized Column Order here. Zero-based or One-based? - I'm going to do zero-based for now :)
    public async Task<ActionResult> CreateColumn ([FromBody] ColumnCreateRequest columnCreateRequest)
    {
        if (columnCreateRequest is null)
        {
            return BadRequest ("There was no Column Request passed in!");
        }

        var boardsFromTable = await _boardRepository.QueryBoardsAsync (board => board.PartitionKey == columnCreateRequest.BoardID.ToString ());
        if (boardsFromTable.Count () is 0)
            return BadRequest ("The board ID passed in does not exist.");

        //if (columnCreateRequest.Order > boardsFromTable.Count ())  //If equal then we're just going to add it to the end
        //    return BadRequest ("The order passed in is too high.");

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

        var columnsToUpdateOrder = await _columnRepository.QueryColumnsAsync (column => column.ColumnOrder >= newColumn.ColumnOrder
                                                                                        && column.RowKey == "20a88077-10d4-4648-92cb-7dc7ba5b8df5");
        var columnJustAdded = columnsToUpdateOrder.FirstOrDefault (column => column.PartitionKey == newColumn.PartitionKey);
        if (columnJustAdded is not null)
        {
            var columnJustAddedIndex = columnsToUpdateOrder.IndexOf (columnJustAdded);
            if (columnJustAddedIndex is -1)
                return BadRequest ("Cannot find newly added column");
            columnsToUpdateOrder.RemoveAt (columnJustAddedIndex);
        }
        else
            return BadRequest ("The new column was not added into the database.");

        foreach (var column in columnsToUpdateOrder!)
            column.ColumnOrder ++;
        await _columnRepository.UpdateColumnBatchAndTheirBoardCardsAsync (columnsToUpdateOrder);

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

        ColumnPatchRequest? convertedColumnToUpdate = null;
        try
        {
            convertedColumnToUpdate = _columnRepository.ApplyJsonPatchDocumentToColumn (columnPatchRequest, columnToUpdate);
        }
        catch (JsonPatchException jsonPatchEx)
        {
            return BadRequest ($"The patch request is invalid. Problem(s): {jsonPatchEx.Message}");//This should get a unit and/or integration test
        }
            
        var columnOrderChange = _columnRepository.GetColumnOrderChange (columnToUpdate, convertedColumnToUpdate!);

        Collection<Column>? otherColumnsWithUpdatedOrder = null;
        if (columnPatchRequest.Operations.Any (operation => string.Equals (operation.path, $"/{nameof (ColumnPatchRequest.Order)}", StringComparison.OrdinalIgnoreCase)))
        {
            var columnCollection = await _columnRepository.GetAllColumnsForBoard (boardID: Guid.Parse ("20a88077-10d4-4648-92cb-7dc7ba5b8df5"));
            try
            {
                otherColumnsWithUpdatedOrder = _columnRepository.ApplyAllOtherColumnOrdersAsync (columnCollection, columnOrderChange.oldOrder, columnOrderChange.newOrder);
            }
            catch (Exception ex)
            {
                return BadRequest (ex);
            }
        }

        columnToUpdate.Title = convertedColumnToUpdate.Title;
        columnToUpdate.ColumnOrder = convertedColumnToUpdate.Order;

        if (otherColumnsWithUpdatedOrder is not null)
            otherColumnsWithUpdatedOrder.Add (columnToUpdate);
        var allUpdatedColumns = otherColumnsWithUpdatedOrder ?? new Collection<Column> { columnToUpdate };
        await _columnRepository.UpdateColumnBatchAndTheirBoardCardsAsync (allUpdatedColumns);

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
        var columnCollection = await _columnRepository.QueryColumnsAsync (column => column.PartitionKey == ID.ToString ());

        if (columnCollection.Count () is 0)
            return NotFound ("The column you are searching for was not found.");
        if (columnCollection.Count () > 1)
            return StatusCode (StatusCodes.Status500InternalServerError, "Multiple columns were found with the same ID.");

        var columnFromDatabase = columnCollection.Single ();
        var columnToDeleteResponse = await _columnTable.DeleteEntityAsync (columnFromDatabase.PartitionKey, columnFromDatabase.RowKey);//Something seems to go wrong around here?

        var columnsToUpdateOrder = await _columnRepository.QueryColumnsAsync (column => column.ColumnOrder > columnFromDatabase.ColumnOrder
                                                                                        && column.RowKey == "20a88077-10d4-4648-92cb-7dc7ba5b8df5");
        foreach (var column in columnsToUpdateOrder!)
            column.ColumnOrder --;
        await _columnRepository.UpdateColumnBatchAndTheirBoardCardsAsync (columnsToUpdateOrder);

        var columnToTransferCandidates = await _columnRepository.QueryColumnsAsync (column => column.RowKey == "20a88077-10d4-4648-92cb-7dc7ba5b8df5"
                                                                                    && (column.ColumnOrder == columnFromDatabase.ColumnOrder
                                                                                        || column.ColumnOrder == columnFromDatabase.ColumnOrder - 1));
        var columnToTransfer = columnToTransferCandidates.Count is 2 ?
            columnToTransferCandidates.MaxBy (column => column.ColumnOrder) :
            columnToTransferCandidates.Single ();
        await _columnRepository.UpdateColumnToDeleteBordCardBatchAsync (columnFromDatabase, columnToTransfer!);

        if (!columnToDeleteResponse.IsError)
            return Ok (); //Is there a better Status to return? NoContent perhaps?
        else
            return StatusCode (StatusCodes.Status500InternalServerError, "Could not delete column.");
    }
}