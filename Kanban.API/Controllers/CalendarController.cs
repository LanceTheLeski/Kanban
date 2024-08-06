using Kanban.API.Models;
using Kanban.API.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Kanban.API.Controllers;

[ApiController]
[Route ("kanban/calendars/dates")]
public class CalendarController : Controller
{
    private readonly ICalendarRepository _calendarRepository;

    public CalendarController (ICalendarRepository calendarRepository)
    {
        _calendarRepository = calendarRepository;
    }

    [HttpGet ("fetch/{ID:guid}")]
    public async Task<ActionResult> FetchCalendar (Guid ID)
    {
        var dates = _calendarRepository.QueryDatesAsync (date => date.RowKey == ID.ToString ());

        return Ok ();
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
        var boardsFromTable = _calendarTable.QueryAsync<Board> (board => board.RowKey == ID.ToString ());
        await foreach (var board in boardsFromTable)
            boardList.Add (board);

        if (boardList.Count () is 0)
            return NotFound ("The board card you are searching for was not found.");

        if (boardList.Count () > 1)
            return StatusCode (StatusCodes.Status500InternalServerError, "Multiple board cards were found with the same ID.");

        var boardFromDatabase = boardList.Single ();
        var cardToDelete = await _calendarRepository.DeleteEntityAsync (boardFromDatabase.PartitionKey, boardFromDatabase.RowKey);

        if (!cardToDelete.IsError)
            return Ok (); //Is there a better Status to return? NoContent perhaps?
        else
            return StatusCode (StatusCodes.Status500InternalServerError, "Could not delete board card.");
    }
}