using Kanban.API.Models;
using Kanban.API.Repositories;
using Kanban.Contracts.Request.Create;
using Kanban.Contracts.Request.Patch;
using Kanban.Contracts.Response;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;

namespace Kanban.API.Controllers;

[ApiController]
[Route ("kanban/calendars")]
public class CalendarController : Controller
{
    private readonly IDateRepository _dateRepository;
    private readonly ITagRepository _tagRepository;
    private readonly ITaskRepository _taskRepository;

    public CalendarController (IDateRepository dateRepository,
                               ITagRepository tagRepository,
                               ITaskRepository taskRepository)
    {
        _dateRepository = dateRepository;
        _tagRepository = tagRepository;
        _taskRepository = taskRepository;
    }

    [HttpGet ("months/fetch/{ID:guid}")]
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

        var taskIDsForMonth = tagsForMonth.Select (tag => tag.RowKey.ToString ());
        var tasksForMonth = new List<Models.Task> ();
        foreach (var taskID in taskIDsForMonth)
            tasksForMonth.AddRange (await _taskRepository.QueryTasksAsync (task => task.PartitionKey == taskID));

        var monthResponse = new MonthResponse ();
        foreach (var date in dates)
        {
            var tagIDsForDay = tagGroupsForMonth.Where (tagGroup => tagGroup.PartitionKey == date.CardTagGroupID.ToString ())
                                                .Select (tagGroup => tagGroup.RowKey);
            var taskIDsForDay = tagsForMonth.Where (tag => tagIDsForDay.Contains(tag.PartitionKey))
                                           .Select (tagGroup => tagGroup.RowKey);
            var tasksForDay = tasksForMonth.Where (task => taskIDsForDay.Contains (task.PartitionKey));

            var tasks = new List<MonthResponse.BasicTask> ();
            foreach (var task in tasksForDay)
                tasks.Add (new MonthResponse.BasicTask { Title = task.Title, isCompleted = new Random ().Next(2) == 0, TaskType = "API-defined Placeholder" });

            monthResponse.Days.Add (new MonthResponse.BasicDate
            {
                ID = date.PartitionKey,
                DateOrder = date.DateOrder,
                WeekOrder = date.WeekOrder,
                DayOfTheWeekOrder = date.DayOfTheWeekOrder,
                Tasks = tasks
            });
        }

        return Ok (monthResponse);
    }

    [HttpPost ("dates/create")]
    public async Task<ActionResult> CreateDate ([FromBody] DateCreateRequest dateCreateRequest)
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
            RowKey = dateCreateRequest.MonthID.ToString (),

            DateOrder = dateCreateRequest.DateOrder,
            WeekOrder = dateCreateRequest.WeekOrder,
            DayOfTheWeekOrder = dateCreateRequest.DayOfTheWeekOrder,
            MonthOrder = dateCreateRequest.MonthOrder,
            MonthName = dateCreateRequest.MonthName,
            Year = dateCreateRequest.Year,

            DistinctBoardCount = 0,
            CardTagGroupID = Guid.Empty
        };

        var addDateResponse = await _dateRepository.AddDateAsync (newDate);
        if (addDateResponse.IsError)
        {
            //We might want to have better verification later for failures. I'm thinking we actually query the table and grab the date so we can map it to a response object
            return StatusCode (StatusCodes.Status500InternalServerError, $"Could not insert a new date into database. Internal status: {addDateResponse.Status}");
        }
        var dateResponse = new DateResponse
        {
            ID = newDate.PartitionKey,

            DateOrder = newDate.DateOrder,
            WeekOrder = newDate.WeekOrder,
            DayOfTheWeekOrder = newDate.DayOfTheWeekOrder,

            Tasks = new List<DateResponse.BasicTask> ()
        };

        return StatusCode (StatusCodes.Status201Created, dateResponse);
    }

    [HttpPatch ("months/{monthID:guid}/dates/update/{dateID:guid}")]
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

        dateToUpdate.DateOrder = convertedDateToUpdate.DateOrder;
        dateToUpdate.WeekOrder = convertedDateToUpdate.WeekOrder;
        dateToUpdate.DayOfTheWeekOrder = convertedDateToUpdate.DayOfTheWeekOrder;
        dateToUpdate.MonthOrder = convertedDateToUpdate.MonthOrder;
        dateToUpdate.MonthName = convertedDateToUpdate.MonthName;
        dateToUpdate.Year = convertedDateToUpdate.Year;

        var response = await _dateRepository.UpdateDateAsync (dateToUpdate);
        if (response.IsError)
        {
            return BadRequest ($"Could not update date. Internal status: {response.Status}");
        }

        var dateResponse = new DateResponse
        {
            ID = dateToUpdate.PartitionKey,
            DateOrder = dateToUpdate.DateOrder,
            WeekOrder = dateToUpdate.WeekOrder,
            DayOfTheWeekOrder = dateToUpdate.DayOfTheWeekOrder,
            Tasks = new List<DateResponse.BasicTask> ()
        };

        return Ok (dateResponse);
    }

    [HttpDelete ("dates/delete/{ID:guid}")]
    public async Task<ActionResult> DeleteDate (Guid ID)
    {
        //todo

        return StatusCode (StatusCodes.Status418ImATeapot);
    }
}