using Azure.Data.Tables;
using Kanban.DTOs;
using Kanban.Models;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace Kanban.Controllers;

[ApiController]
[Route ("kanban/boards")]
public class BoardController : ControllerBase
{
    private const string boards = "Boards";
    private const string columns = "Columns";
    private const string swimlanes = "Swimlanes";
    private const string cards = "Cards";
    private const string tags = "Tags";

    private readonly IConfiguration _configuration;
    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _boardTable;
    private readonly TableClient _columnTable;
    private readonly TableClient _swimlaneTable;
    private readonly TableClient _cardTable;
    private readonly TableClient _tagTable;

    public BoardController (IConfiguration configuration)
    {
        _configuration = configuration;
        _tableServiceClient = new TableServiceClient (@"DefaultEndpointsProtocol=https;AccountName=honubrain;AccountKey=u+mGlfG8dFCbILdHQHWpkpRTS9iDifga40mMg6PV4Rl9ivvQypmHgYwy0Ib1d6DuTST18rtcfpth+AStijA6GA==;EndpointSuffix=core.windows.net");
        _boardTable = _tableServiceClient.GetTableClient (tableName: boards);
        _columnTable = _tableServiceClient.GetTableClient (tableName: columns);
        _swimlaneTable = _tableServiceClient.GetTableClient (tableName: swimlanes);
        _cardTable = _tableServiceClient.GetTableClient (tableName: cards);
        _tagTable = _tableServiceClient.GetTableClient (tableName: tags);
    }

    [HttpGet ("getboard/{ID:guid}")]
    public async Task<ActionResult> GetBoardAsync (Guid ID)
    {
        var boardList = new List<Board> ();
        var boardsFromTable = _boardTable.QueryAsync<Board> (board => board.PartitionKey == ID.ToString ());
        await foreach (var board in boardsFromTable) 
            boardList.Add (board);

        var boardToReturn = boardList.FirstOrDefault ();
        if (boardToReturn is null) 
            return StatusCode (StatusCodes.Status404NotFound);

        var columnList = boardToReturn.Columns;
        var swimlaneList = boardToReturn.Swimlanes;
        var cardList = boardToReturn.Cards;

        var boardResponse = new BoardResponse ();
        foreach (var column in columnList)
        {
            var swimlanes = new List<BoardResponse.BasicSwimlane> ();
            foreach (var swimlane in swimlaneList)
            {
                //var cardsToAdd = swimlane.Cards.SelectMany (swimCard =>
                //                    column.Cards.Where (colCard => 
                //                        colCard.ID == swimCard.ID));

                var cards = new List<BoardResponse.BasicCard> ();
                //foreach (var card in cardsToAdd)
                foreach (var card in cardList)
                {
                    cards.Add (new BoardResponse.BasicCard
                    {
                        Title = card.Title,
                        Description = card.Description
                    });
                }

                swimlanes.Add (new BoardResponse.BasicSwimlane
                {
                    Title = swimlane.Title,
                    Cards = cards
                });
            }

            boardResponse.Columns.Add (new BoardResponse.BasicColumn
            {
                Title = column.Title,
                Swimlanes = swimlanes
            }); 
        }
        boardResponse.Swimlanes = boardList.SelectMany (board => 
                                    board.Swimlanes.Select (swimlane => 
                                        swimlane.Title))
                                            .Distinct ()
                                            .ToList ();

        return StatusCode (StatusCodes.Status200OK, boardResponse);
    }

    [HttpPost ("createboard")]
    public ActionResult CreateBoard ()
    {
        //todo

        //For later when we create in the table
        //await tableClient.AddEntityAsync<Product>(prod1);

        return StatusCode (StatusCodes.Status418ImATeapot);
    }

    [HttpGet ("getcolumn/{ID:guid}")]
    public ActionResult GetColumn (Guid ID)
    {
        //todo
        return StatusCode (StatusCodes.Status200OK, new Column ());
    }

    [HttpPost ("createcolumn")]
    public ActionResult CreateColumn ()
    {
        //todo
        return StatusCode (StatusCodes.Status418ImATeapot);
    }

    [HttpGet ("getswimlane")]
    public ActionResult GetSwimlane ()
    {
        //todo
        return StatusCode (StatusCodes.Status200OK, new Swimlane ());
    }

    [HttpPost ("createswimlane")]
    public ActionResult CreateSwimlane ()
    {
        //todo
        return StatusCode (StatusCodes.Status418ImATeapot);
    }
}