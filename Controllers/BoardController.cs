using Azure.Data.Tables;
using Kanban.Components.DTOs;
using Kanban.Contexts;
using Kanban.Models;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Kanban.Controllers;

[ApiController]
[Route ("kanban")]
public class BoardController : Controller
{
    private const string boards = "Boards";
    private const string columns = "Columns";
    private const string swimlanes = "Swimlanes";
    private const string cards = "Cards";
    private const string tags = "Tags";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _boardTable;
    private readonly TableClient _columnTable;
    private readonly TableClient _swimlaneTable;
    private readonly TableClient _cardTable;
    private readonly TableClient _tagTable;

    public BoardController (IOptions<CosmosOptions> cosmosOptions)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _boardTable = _tableServiceClient.GetTableClient (tableName: boards);
        _columnTable = _tableServiceClient.GetTableClient (tableName: columns);
        _swimlaneTable = _tableServiceClient.GetTableClient (tableName: swimlanes);
        _cardTable = _tableServiceClient.GetTableClient (tableName: cards);
        _tagTable = _tableServiceClient.GetTableClient (tableName: tags);
    }

    [HttpGet ("getboard/{ID:guid}")]
    public async Task<ActionResult> GetBoard (Guid ID)
    {
        var boardList = new List<Board> ();
        var boardsFromTable = _boardTable.QueryAsync<Board> (board => board.PartitionKey == ID.ToString ());
        await foreach (var board in boardsFromTable) 
            boardList.Add (board);

        var columnList = new List<Column> ();
        var columnsFromTable = _columnTable.QueryAsync<Column> (column => column.RowKey == ID.ToString ());
        await foreach (var column in columnsFromTable)
            columnList.Add (column);
        var columnListOrdered = columnList
            .OrderBy (column => column.ColumnOrder)
            .Select (column => (column.Title, column.PartitionKey, column.ColumnOrder));

        var swimlaneList = new List<Swimlane> ();
        var swimlanesFromTable = _swimlaneTable.QueryAsync<Swimlane> (swimlane => swimlane.RowKey == ID.ToString ());
        await foreach (var swimlane in swimlanesFromTable)
            swimlaneList.Add (swimlane);
        var swimlaneListOrdered = swimlaneList
            .OrderBy (swimlane => swimlane.SwimlaneOrder)
            .Select (swimlane => (swimlane.Title, swimlane.PartitionKey, swimlane.SwimlaneOrder));

        var boardResponse = new BoardResponse ();
        foreach (var column in columnListOrdered)
        {
            var swimlanes = new List<BoardResponse.BasicSwimlane> ();
            foreach (var swimlane in swimlaneListOrdered)
            {
                var cardList = boardList
                    .Where (board => board.ColumnID == Guid.Parse (column.PartitionKey) && board.SwimlaneID == Guid.Parse (swimlane.PartitionKey))
                    .Select (board => (board.CardTitle, board.CardDescription, board.RowKey));

                var cards = new List<BoardResponse.BasicCard> ();
                foreach (var card in cardList)
                {
                    cards.Add (new BoardResponse.BasicCard
                    {
                        ID = card.RowKey,
                        Title = card.CardTitle,
                        Description = card.CardDescription
                    });
                }

                swimlanes.Add (new BoardResponse.BasicSwimlane
                {
                    ID = swimlane.PartitionKey,
                    Title = swimlane.Title,
                    Order = swimlane.SwimlaneOrder,
                    Cards = cards
                });
            }

            boardResponse.Columns.Add (new BoardResponse.BasicColumn
            {
                ID = column.PartitionKey,
                Title = column.Title,
                Order = column.ColumnOrder,
                Swimlanes = swimlanes
            }); 
        }

        return Ok (boardResponse);
    }

    //[HttpPost ("createboard")]
    public ActionResult CreateBoard ()
    {
        //todo

        //For later when we create in the table
        //await tableClient.AddEntityAsync<Product>(prod1);

        return StatusCode (StatusCodes.Status418ImATeapot);
    }

    [HttpGet ("getcolumn/{ID:guid}")]
    public async Task<ActionResult> GetColumn (Guid ID)
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

    [HttpPost ("createcolumn")]
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
        
        var addEntityResponse = await _columnTable.AddEntityAsync (newColumn);//Do we need to update the boardTable as well?
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

    [HttpPatch ("updatecolumn/{ID:Guid}")]
    public async Task<ActionResult> UpdateColumn (Guid ID, [FromBody] JsonPatchDocument<ColumnPatchRequest> columnPatchRequest)
    {
        if (columnPatchRequest is null)
        {
            return BadRequest ("There was no Patch Request passed in!");
        }

        //Currently we are doing this for the ColumnTable. But we might need to update the boards table as well?
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

        var columnResponse = new ColumnResponse
        {
            ID = Guid.Parse(columnToUpdate.PartitionKey),
            Title = columnToUpdate.Title,
            BoardID = Guid.Parse(columnToUpdate.RowKey),
            Order = columnToUpdate.ColumnOrder
        };

        return Ok (columnResponse);
    }

    //What happens if cards are in this column? Where do they get moved to?
    [HttpDelete ("deletecolumn/{ID:guid}")] // Need to delete from board AND column tables. There might also be extensions to remove. For now though, I'm just going to do board.
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

        //Currently we are doing this for the ColumnTable. But we might need to update the boards table as well?
        var columnFromDatabase = columnList.Single ();
        var columnToDelete = _columnTable.DeleteEntityAsync (columnFromDatabase.PartitionKey, columnFromDatabase.RowKey);

        if (columnToDelete.IsCompletedSuccessfully)
            return Ok (); //Is there a better Status to return? NoContent perhaps?
        else
            return StatusCode (StatusCodes.Status500InternalServerError, "Could not delete column.");
    }

    [HttpGet ("getswimlane/{ID:Guid}")]
    public async Task<ActionResult> GetSwimlane (Guid ID)
    {
        var swimlaneList = new List<Swimlane> ();
        var swimlanesFromTable = _swimlaneTable.QueryAsync<Swimlane> (swimlane => swimlane.PartitionKey == ID.ToString ());
        await foreach (var swimlane in swimlanesFromTable)
            swimlaneList.Add (swimlane);

        //If multiple boards have the same swimlane then there will be multiple results here. I think we only need to grab the first for now
        if (swimlaneList.Count () is 0)
            return NotFound ("The column you are searching for was not found.");

        var swimlaneToReturn = swimlaneList.First ();
        var swimlaneResponse = new ColumnResponse
        {
            ID = Guid.Parse (swimlaneToReturn.PartitionKey),
            Title = swimlaneToReturn.Title,
            BoardID = Guid.Parse (swimlaneToReturn.RowKey), //Might be an issue later if we need another board's swimlane
            Order = swimlaneToReturn.SwimlaneOrder
        };

        return Ok (swimlaneResponse); 
    }

    [HttpPost ("createswimlane")]
    public async Task<ActionResult> CreateSwimlane ([FromBody] SwimlaneCreateRequest swimlaneCreateRequest)
    {
        if (swimlaneCreateRequest is null)
        {
            return BadRequest ("There was no Swimlane Request passed in!");
        }

        Board boardFromTable = null;
        var boardsFromTable = _boardTable.QueryAsync<Board> (board => board.PartitionKey == swimlaneCreateRequest.BoardID.ToString ());
        await foreach (var board in boardsFromTable)//This is VERY inefficient. I want to 
            boardFromTable = board;
        if (boardFromTable is null)
        {
            return BadRequest ("The board ID passed in does not exist.");
        }

        var newSwimlaneID = Guid.NewGuid ();
        var newSwimlane = new Swimlane
        {
            PartitionKey = newSwimlaneID.ToString (),
            RowKey = swimlaneCreateRequest.BoardID.ToString (),

            Title = swimlaneCreateRequest.Title,
            SwimlaneOrder = swimlaneCreateRequest.Order,

            BoardTitle = boardFromTable.Title
        };

        var addEntityResponse = await _swimlaneTable.AddEntityAsync (newSwimlane);//Do we need to update the boardTable as well?
        if (addEntityResponse.IsError)
        {
            //We might want to have better verification later for failures. I'm thinking we actually query the table and grab the swimlane so we can map it to a response object
            return StatusCode (StatusCodes.Status500InternalServerError, $"Could not insert a new swimlane into database. Internal status: {addEntityResponse.Status}");
        }

        var swimlaneResponse = new SwimlaneResponse
        {
            ID = Guid.Parse (newSwimlane.PartitionKey),
            Title = newSwimlane.Title,
            BoardID = Guid.Parse (newSwimlane.RowKey),
            Order = newSwimlane.SwimlaneOrder
        };

        return StatusCode (StatusCodes.Status201Created, swimlaneResponse);
    }

    [HttpPatch ("updateswimlane/{ID:Guid}")]
    public async Task<ActionResult> UpdateSwimlane (Guid ID, [FromBody] JsonPatchDocument<SwimlanePatchRequest> swimlanePatchRequest)
    {
        if (swimlanePatchRequest is null)
        {
            return BadRequest ("There was no Patch Request passed in!");
        }

        //Currently we are doing this for the SwimlaneTable. But we might need to update the boards table as well?
        var swimlaneFromTable = await _swimlaneTable.GetEntityAsync<Swimlane> (partitionKey: ID.ToString (), rowKey: @"20a88077-10d4-4648-92cb-7dc7ba5b8df5");
        var swimlaneToUpdate = swimlaneFromTable.Value;

        var convertedSwimlaneToUpdate = new SwimlanePatchRequest
        {
            Title = swimlaneToUpdate.Title,
            Order = swimlaneToUpdate.SwimlaneOrder
        };

        swimlanePatchRequest.ApplyTo (convertedSwimlaneToUpdate); //Could add a ModelState validation somewhere here as well..

        swimlaneToUpdate.Title = convertedSwimlaneToUpdate.Title;
        swimlaneToUpdate.SwimlaneOrder = convertedSwimlaneToUpdate.Order;

        var response = await _swimlaneTable.UpdateEntityAsync (swimlaneToUpdate, Azure.ETag.All);
        if (response.IsError)
        {
            return BadRequest ($"Could not update card. Internal status: {response.Status}");
        }

        var swimlaneResponse = new ColumnResponse
        {
            ID = Guid.Parse (swimlaneToUpdate.PartitionKey),
            Title = swimlaneToUpdate.Title,
            BoardID = Guid.Parse (swimlaneToUpdate.RowKey),
            Order = swimlaneToUpdate.SwimlaneOrder
        };

        return Ok (swimlaneResponse);
    }

    //What happens if cards are in this swimlane? Where do they get moved to?
    [HttpDelete ("deleteswimlane/{ID:Guid}")]
    public async Task<ActionResult> DeleteSwimlane (Guid ID)
    {
        var swimlaneList = new List<Swimlane> ();
        var swimlanesFromTable = _swimlaneTable.QueryAsync<Swimlane> (column => column.PartitionKey == ID.ToString ());
        await foreach (var swimlane in swimlanesFromTable)
            swimlaneList.Add (swimlane);

        if (swimlaneList.Count () is 0)
            return NotFound ("The swimlane you are searching for was not found.");

        if (swimlaneList.Count () > 1)
            return StatusCode (StatusCodes.Status500InternalServerError, "Multiple sswimlanes were found with the same ID.");
        
        //Currently we are doing this for the ColumnTable. But we might need to update the boards table as well?
        var swimlaneFromDatabase = swimlaneList.Single ();
        var swimlaneToDelete = _swimlaneTable.DeleteEntityAsync (swimlaneFromDatabase.PartitionKey, swimlaneFromDatabase.RowKey);

        if (swimlaneToDelete.IsCompletedSuccessfully)
            return Ok (); //Is there a better Status to return? NoContent perhaps?
        else
            return StatusCode (StatusCodes.Status500InternalServerError, "Could not delete column.");
    }
}