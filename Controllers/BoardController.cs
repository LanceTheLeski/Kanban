using Azure.Data.Tables;
using Kanban.Components.DTOs;
using Kanban.Contexts;
using Kanban.Models;
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
        var boardsFromTable = _boardTable.QueryAsync<Board> (board => board.PartitionKey == @"20a88077-10d4-4648-92cb-7dc7ba5b8df5");
        await foreach (var board in boardsFromTable) 
            boardList.Add (board);

        var columnList = new List<Column> ();
        var columnsFromTable = _columnTable.QueryAsync<Column> (column => column.RowKey == @"20a88077-10d4-4648-92cb-7dc7ba5b8df5");
        await foreach (var column in columnsFromTable)
            columnList.Add (column);
        var columnListOrdered = columnList
            .OrderBy (column => column.ColumnOrder)
            .Select (column => (column.Title, column.PartitionKey, column.ColumnOrder));

        var swimlaneList = new List<Swimlane> ();
        var swimlanesFromTable = _swimlaneTable.QueryAsync<Swimlane> (swimlane => swimlane.RowKey == @"20a88077-10d4-4648-92cb-7dc7ba5b8df5");
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
        //return StatusCode (StatusCodes.Status200OK, boardResponse);
    }

    //[HttpPost ("createboard")]
    public ActionResult CreateBoard ()
    {
        //todo

        //For later when we create in the table
        //await tableClient.AddEntityAsync<Product>(prod1);

        return StatusCode (StatusCodes.Status418ImATeapot);
    }

    //[HttpGet ("getcolumn/{ID:guid}")]
    public ActionResult GetColumn (Guid ID)
    {
        //todo
        return StatusCode (StatusCodes.Status200OK, new Column ());
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
        await foreach (var board in boardsFromTable)//This is VERY inefficient. I want to 
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

    //[HttpGet ("getswimlane")]
    public ActionResult GetSwimlane ()
    {
        //todo
        return StatusCode (StatusCodes.Status200OK, new Swimlane ());
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

        var addEntityResponse = await _swimlaneTable.AddEntityAsync (newSwimlane);
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
}