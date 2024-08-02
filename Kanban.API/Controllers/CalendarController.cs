using Azure.Data.Tables;
using Kanban.API.Models;
using Kanban.API.Options;
using Kanban.API.Repositories;
using Kanban.Contracts.Response;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Kanban.API.Controllers;

[ApiController]
[Route ("kanban/calendars")]
public class CalendarController
{
    private const string calendars = "Calendars";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _calendarTable;

    private readonly ICalendarRepository _calendarRepository;

    public CalendarController (IOptions<CosmosOptions> cosmosOptions,
                               ICalendarRepository calendarRepository)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _calendarTable = _tableServiceClient.GetTableClient (tableName: calendars);

        _calendarRepository = calendarRepository;
    }

    [HttpGet ("fetch/{ID:guid}")]
    public async Task<ActionResult> FetchCalendar (Guid ID)
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

    [HttpPost ("create")]
    public ActionResult CreateBoard ()
    {
        //todo

        //For later when we create in the table
        //await tableClient.AddEntityAsync<Product>(prod1);

        return StatusCode (StatusCodes.Status418ImATeapot);
    }

    [HttpPatch ("update/{IG:guid}")]
    public ActionResult UpdateBoard ()
    {
        //todo

        return StatusCode (StatusCodes.Status418ImATeapot);
    }

    [HttpDelete ("delete/{ID:guid}")] // Need to delete from board AND card tables. There might also be extensions to remove. For now though, I'm just going to do board.
    public async Task<ActionResult> DeleteCard (Guid ID)
    {
        var boardList = new List<Board> ();
        var boardsFromTable = _boardTable.QueryAsync<Board> (board => board.RowKey == ID.ToString ());
        await foreach (var board in boardsFromTable)
            boardList.Add (board);

        if (boardList.Count () is 0)
            return NotFound ("The board card you are searching for was not found.");

        if (boardList.Count () > 1)
            return StatusCode (StatusCodes.Status500InternalServerError, "Multiple board cards were found with the same ID.");

        var boardFromDatabase = boardList.Single ();
        var cardToDelete = await _boardTable.DeleteEntityAsync (boardFromDatabase.PartitionKey, boardFromDatabase.RowKey);

        if (!cardToDelete.IsError)
            return Ok (); //Is there a better Status to return? NoContent perhaps?
        else
            return StatusCode (StatusCodes.Status500InternalServerError, "Could not delete board card.");
    }
}