using ArcStrides.API.Calendars.Mappers;
using ArcStrides.API.Models;
using ArcStrides.API.Models.Board;
using ArcStrides.API.Models.Calendar;
using ArcStrides.API.Models.TagGroup;
using ArcStrides.API.Repositories;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;

namespace ArcStrides.API.Controllers;

[ApiController]
[Route ("arcstrides/calendars")]
public class CalendarController : Controller
{
    private readonly IDateRepository _dateRepository;
    private readonly ITagRepository _tagRepository;
    private readonly ICardRepository _cardRepository;
    private readonly ITaskRepository _taskRepository;

    private readonly IDateMapper _dateMapper;

    public CalendarController (IDateRepository dateRepository,
                               ITagRepository tagRepository,
                               ICardRepository cardRepository,
                               ITaskRepository taskRepository,
                               IDateMapper dateMapper)
    {
        _dateRepository = dateRepository;
        _tagRepository = tagRepository;
        _cardRepository = cardRepository;
        _taskRepository = taskRepository;

        _dateMapper = dateMapper;
    }

    [HttpGet ("months/{ID:guid}")]
    public async Task<ActionResult> FetchMonth (Guid ID)
    {
        var dates = await _dateRepository.QueryDatesAsync (date => date.RowKey == ID.ToString ());

        //I like to think that a really nice JOIN will be the solution to this one day :)
        var tagGroupIDsForMonth = dates.Select (date => date.CardTagGroupID.ToString ());
        var tagGroupsForMonth = new List<TagGroup> ();
        foreach (var tagGroupID in tagGroupIDsForMonth)
            tagGroupsForMonth.AddRange (await _tagRepository.QueryTagGroupsAsync (tagGroup => tagGroup.PartitionKey == tagGroupID));//This could very well break

        var tagIDsForMonth = tagGroupsForMonth.Select (tagGroup => tagGroup.RowKey.ToString ());
        var tagsForMonth = new List<Tag> ();
        foreach (var tagID in tagIDsForMonth)
            tagsForMonth.AddRange (await _tagRepository.QueryTagsAsync (tag => tag.PartitionKey == tagID));

        var cardIDsForMonth = tagsForMonth.Select (tag => tag.RowKey.ToString ());
        var cardsForMonth = new List<Card> ();
        foreach (var cardID in cardIDsForMonth)
            cardsForMonth.AddRange (await _cardRepository.QueryCardsAsync (card => card.PartitionKey == cardID));

        var dateList = new List<DateResponse> ();
        foreach (var date in dates)
        {
            var tagIDsForDay = tagGroupsForMonth.Where (tagGroup => tagGroup.PartitionKey == date.CardTagGroupID.ToString ())
                                                .Select (tagGroup => tagGroup.RowKey);
            var cardIDsForDay = tagsForMonth.Where ((Func<Tag, bool>) (tag => Enumerable.Contains<string> (tagIDsForDay, tag.PartitionKey)))
                                           .Select <Tag, string> (tagGroup => tagGroup.RowKey);
            var cardsForDay = cardsForMonth.Where (card => cardIDsForDay.Contains (card.PartitionKey));

            var cards = new List<CardResponse> ();
            foreach (var card in cardsForDay) 
            {
                var tasks = await _taskRepository.QueryTasksAsync (task => task.RowKey == card.PartitionKey);

                var taskResponseList = new List<TaskResponse> ();
                foreach (var task in tasks.ToList ())
                    taskResponseList.Add (new TaskResponse 
                    {
                        Title = task.Title,
                        TaskTypeID = task.TaskTypeID,
                        //TaskTypeTitle = "Placeholder!",
                        isCompleted = task.IsComplete
                    });

                cards.Add (new CardResponse
                {
                    Title = card.Title,
                    Tasks = taskResponseList,
                    //Position.BoardID = Guid.Empty
                });
            }
            dateList.Add (new DateResponse
            {
                ID = Guid.Parse(date.PartitionKey),
                DateOrder = date.DateOrder,
                WeekOrder = date.WeekOrder,
                DayOfTheWeekOrder = date.DayOfTheWeekOrder,
                Cards = cards
            });
        }
        var monthResponse = new MonthResponse 
        { 
            Dates = dateList,
        };

        return Ok (monthResponse);
    }

    [HttpPost ("months")]
    public async Task<ActionResult> CreateMonth ()
    {
        //todo

        return StatusCode (StatusCodes.Status418ImATeapot);
    }

    [HttpPost ("months/{monthID:guid}/dates")]
    public async Task<ActionResult> CreateDate ([FromRoute] Guid monthID, [FromBody] DateCreateRequest dateCreateRequest)
    {
        if (dateCreateRequest is null)
        {
            return BadRequest ("There was no Date Request passed in!");
        }

        //Validation for correct month later..

        var newDateID = Guid.NewGuid ();
        var newDate = new Date
        {
            PartitionKey = newDateID.ToString (),
            RowKey = monthID.ToString (),

            DateOrder = dateCreateRequest.DateOrder.Value,
            WeekOrder = dateCreateRequest.WeekOrder.Value,
            DayOfTheWeekOrder = dateCreateRequest.DayOfTheWeekOrder.Value,
            MonthOrder = dateCreateRequest.MonthOrder.Value,
            MonthName = dateCreateRequest.MonthName,
            Year = dateCreateRequest.Year.Value,

            CardTagGroupID = Guid.Empty
        };

        await _dateRepository.AddDateAsync (newDate);
        /*if (addDateResponse.IsError)
        {
            //We might want to have better verification later for failures. I'm thinking we actually query the table and grab the date so we can map it to a response object
            return StatusCode (StatusCodes.Status500InternalServerError, $"Could not insert a new date into database. Internal status: {addDateResponse.Status}");
        }*/
        /*var dateResponse = new DateResponse
        {
            ID = Guid.Parse(newDate.PartitionKey),

            DateOrder = newDate.DateOrder,
            WeekOrder = newDate.WeekOrder,
            DayOfTheWeekOrder = newDate.DayOfTheWeekOrder,

            Cards = new List<CardResponse> ()
        };*/
        var mapper = new DateMapper ();
        var dateResponse = mapper.MapDateToDateResponse (newDate);

        return StatusCode (StatusCodes.Status201Created, dateResponse);
    }

    [HttpPatch ("months/{monthID:guid}/dates/{dateID:guid}")]
    public async Task<ActionResult> UpdateDate (Guid dateID, Guid monthID, [FromBody] JsonPatchDocument<DatePatchRequest> datePatchRequest)
    {
        if (datePatchRequest is null)
        {
            return BadRequest ("There was no Patch Request passed in!");
        }

        var dateFromTable = await _dateRepository.GetDateAsync (dateID: dateID, monthID: monthID);
        if (dateFromTable is null)
            return BadRequest ("The date you want to update does not exist!");
        
        var dateToUpdate = dateFromTable!;
        var convertedDateToUpdate = new DatePatchRequest
        {
            DateOrder = dateToUpdate.DateOrder,
            WeekOrder = dateToUpdate.WeekOrder,
            DayOfTheWeekOrder = dateToUpdate.DayOfTheWeekOrder,
            MonthOrder = dateToUpdate.MonthOrder,
            MonthName = dateToUpdate.MonthName,
            Year = dateToUpdate.Year
        };

        datePatchRequest.ApplyTo (convertedDateToUpdate); //Could add a ModelState validation somewhere here as well..

        dateToUpdate.DateOrder = convertedDateToUpdate.DateOrder.Value;
        dateToUpdate.WeekOrder = convertedDateToUpdate.WeekOrder.Value;
        dateToUpdate.DayOfTheWeekOrder = convertedDateToUpdate.DayOfTheWeekOrder.Value;
        dateToUpdate.MonthOrder = convertedDateToUpdate.MonthOrder.Value;
        dateToUpdate.MonthName = convertedDateToUpdate.MonthName;
        dateToUpdate.Year = convertedDateToUpdate.Year.Value;

        await _dateRepository.UpdateDateAsync (dateToUpdate);
        /*if (response.IsError)
        {
            return BadRequest ($"Could not update date. Internal status: {response.Status}");
        }*/

        /*var dateResponse = new DateResponse
        {
            ID = Guid.Parse(dateToUpdate.PartitionKey),
            DateOrder = dateToUpdate.DateOrder,
            WeekOrder = dateToUpdate.WeekOrder,
            DayOfTheWeekOrder = dateToUpdate.DayOfTheWeekOrder,
            Cards = new List<CardResponse> ()
        };*/
        var mapper = new DateMapper ();
        var dateResponse = mapper.MapDateToDateResponse (dateToUpdate);

        return Ok (dateResponse);
    }

    [HttpDelete ("dates/{ID:guid}")]
    public async Task<ActionResult> DeleteDate (Guid ID)
    {
        //todo

        return StatusCode (StatusCodes.Status418ImATeapot);
    }
}