using Kanban.API.Repositories;
using Kanban.Contracts.Request.Create;
using Kanban.Contracts.Response;
using Microsoft.AspNetCore.Mvc;

namespace Kanban.API.Controllers;

[ApiController]
[Route ("kanban/timelines")]
public class TimelineController : Controller
{
    private readonly ITimelineRepository _timelineRepository;

    public TimelineController (ITimelineRepository timelineRepository)
    {
        _timelineRepository = timelineRepository;
    }

    [HttpGet ("{ID:Guid}")]
    public async Task<ActionResult> FetchTimeline ([FromRoute] Guid taskID, [FromRoute] Guid ID)
    {
        var timeline = await _timelineRepository.GetTimelineAsync (ID, taskID);

        var timelineReponse = new TimelineResponse
        {
            ID = Guid.Parse (timeline.PartitionKey),
            StartDependencyTagGroupID = timeline.StartDependencyTagGroupID,
            StartPreferenceUTC = timeline.StartPreferenceUTC,
            StartDeadlineUTC = timeline.StartDeadlineUTC,
            EndDependencyTagGroupID = timeline.EndDependencyTagGroupID,
            EndPreferenceUTC = timeline.EndPreferenceUTC,
            EndDeadlineUTC = timeline.EndDeadlineUTC
        };

        return StatusCode (StatusCodes.Status200OK, timelineReponse);
    }

    [HttpPost]
    public async Task<ActionResult> CreateTimeline ([FromRoute] Guid taskID, [FromBody] TimelineCreateRequest timelineCreateRequest)
    {
        var newTimeline = new Models.Timeline
        {
            PartitionKey = Guid.NewGuid ().ToString (),
            RowKey = taskID.ToString (),
            StartDependencyTagGroupID = timelineCreateRequest.StartDependencyTagGroupID,
            StartPreferenceUTC = timelineCreateRequest.StartPreferenceUTC,
            StartDeadlineUTC = timelineCreateRequest.StartDeadlineUTC,
            EndDependencyTagGroupID = timelineCreateRequest.EndDependencyTagGroupID,
            EndPreferenceUTC = timelineCreateRequest.EndPreferenceUTC,
            EndDeadlineUTC = timelineCreateRequest.EndDeadlineUTC
        };

        var addTimelineResponse = await _timelineRepository.AddTimelineAsync (newTimeline);
        if (addTimelineResponse.IsError)
        {
            //We might want to have better verification later for failures. I'm thinking we actually query the table and grab the card so we can map it to a response object
            return StatusCode (StatusCodes.Status500InternalServerError, $"Could not insert a new timeline into database. Internal status: {addTimelineResponse.Status}");
        }

        var timelineResponse = new TimelineResponse
        {
            ID = Guid.Parse (newTimeline.PartitionKey),
            StartDependencyTagGroupID = newTimeline.StartDependencyTagGroupID,
            StartPreferenceUTC = newTimeline.StartPreferenceUTC,
            StartDeadlineUTC = newTimeline.StartDeadlineUTC,
            EndDependencyTagGroupID = newTimeline.EndDependencyTagGroupID,
            EndPreferenceUTC = newTimeline.EndPreferenceUTC,
            EndDeadlineUTC = newTimeline.EndDeadlineUTC
        };

        return StatusCode (StatusCodes.Status201Created, timelineResponse);
    }
}