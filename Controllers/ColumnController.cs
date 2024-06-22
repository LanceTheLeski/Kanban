using Azure.Data.Tables;
using Kanban.Components.DTOs;
using Kanban.Contexts;
using Kanban.Models;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Kanban.Controllers;

[ApiController]
[Route ("kanban/columns")]
public class ColumnController : Controller //We should remove the ColumnOrder and ColumnTitle from the Board Table 
{
    private const string boards = "Boards";
    private const string columns = "Columns";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _boardTable;
    private readonly TableClient _columnTable;

    public ColumnController (IOptions<CosmosOptions> cosmosOptions)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _boardTable = _tableServiceClient.GetTableClient (tableName: boards);
        _columnTable = _tableServiceClient.GetTableClient (tableName: columns);
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

    [HttpPost ("create")]
    public async Task<ActionResult> CreateColumn ([FromBody] ColumnCreateRequest columnCreateRequest)
    {
        if (columnCreateRequest is null)
        {
            return BadRequest ("There was no Column Request passed in!");
        }

        Board boardFromTable = null;
        var boardsFromTable = _boardTable.QueryAsync<Board> (board => board.PartitionKey == columnCreateRequest.BoardID.ToString ());
        await foreach (var board in boardsFromTable)//This is VERY inefficient. I want to simply grab the first board record that matches our criteria. Will fix later.
            boardFromTable = board;
        if (boardFromTable is null)
        {
            return BadRequest ("The board ID passed in does not exist.");
        }

        var newColumnID = Guid.NewGuid ();
        var newColumn = new Column
        {
            PartitionKey = newColumnID.ToString (),
            RowKey = columnCreateRequest.BoardID.ToString (),

            Title = columnCreateRequest.Title,
            ColumnOrder = columnCreateRequest.Order,

            BoardTitle = boardFromTable.Title
        };

        var addEntityResponse = await _columnTable.AddEntityAsync (newColumn);
        if (addEntityResponse.IsError)
        {
            //We might want to have better verification later for failures. I'm thinking we actually query the table and grab the column so we can map it to a response object
            return StatusCode (StatusCodes.Status500InternalServerError, $"Could not insert a new column into database. Internal status: {addEntityResponse.Status}");
        }

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
        {
            return BadRequest ("There was no Patch Request passed in!");
        }

        var columnFromTable = await _columnTable.GetEntityAsync<Column> (partitionKey: ID.ToString (), rowKey: @"20a88077-10d4-4648-92cb-7dc7ba5b8df5");
        var columnToUpdate = columnFromTable.Value;

        var convertedColumnToUpdate = new ColumnPatchRequest
        {
            Title = columnToUpdate.Title,
            Order = columnToUpdate.ColumnOrder
        };

        columnPatchRequest.ApplyTo (convertedColumnToUpdate); //Could add a ModelState validation somewhere here as well..

        columnToUpdate.Title = convertedColumnToUpdate.Title;
        columnToUpdate.ColumnOrder = convertedColumnToUpdate.Order;

        var response = await _boardTable.UpdateEntityAsync (columnToUpdate, Azure.ETag.All);
        if (response.IsError)
        {
            return BadRequest ($"Could not update card. Internal status: {response.Status}");
        }

        // Update cards that have the old field. Call that in a repository method called here.

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

        if (!columnToDelete.IsFaulted)
            return Ok (); //Is there a better Status to return? NoContent perhaps?
        else
            return StatusCode (StatusCodes.Status500InternalServerError, "Could not delete column.");
    }
}