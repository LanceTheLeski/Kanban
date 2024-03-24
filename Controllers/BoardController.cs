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

        var columnList = boardList
            .OrderBy (board => board.ColumnOrder)
            .Select (board => (board.ColumnTitle, board.ColumnID));
        var swimlaneList = boardList
            .OrderBy (board => board.SwimlaneOrder)
            .Select (board => (board.SwimlaneTitle, board.SwimlaneID));

        var boardResponse = new BoardResponse ();
        foreach (var column in columnList)
        {
            var swimlanes = new List<BoardResponse.BasicSwimlane> ();
            foreach (var swimlane in swimlaneList)
            {
                var cardList = boardList
                    .Where (board => board.ColumnID == column.ColumnID && board.SwimlaneID == swimlane.SwimlaneID)
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
                    Title = swimlane.SwimlaneTitle,
                    Cards = cards
                });
            }

            boardResponse.Columns.Add (new BoardResponse.BasicColumn
            {
                Title = column.ColumnTitle,
                Swimlanes = swimlanes
            }); 
        }
        boardResponse.Swimlanes = swimlaneList
            .Select (swimlane => swimlane.SwimlaneTitle)
            .ToList ();

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

    //[HttpPost ("createcolumn")]
    public ActionResult CreateColumn ()
    {
        //todo
        return StatusCode (StatusCodes.Status418ImATeapot);
    }

    //[HttpGet ("getswimlane")]
    public ActionResult GetSwimlane ()
    {
        //todo
        return StatusCode (StatusCodes.Status200OK, new Swimlane ());
    }

    //[HttpPost ("createswimlane")]
    public ActionResult CreateSwimlane ()
    {
        //todo
        return StatusCode (StatusCodes.Status418ImATeapot);
    }
}
