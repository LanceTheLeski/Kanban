using FluentValidation;
using ArcStrides.API.Mappers;
using ArcStrides.API.Repositories;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.JsonPatch.Exceptions;
using Microsoft.AspNetCore.Mvc;
using ArcStrides.API.Messages;
using ArcStrides.API.Models.Board;
using ArcStrides.API.Validators;

namespace ArcStrides.API.Controllers;

[ApiController]
[Route ("ArcStrides/boards/{boardID:guid}/timelines")]
public class TimelineController : Controller
{
    private readonly IValidator<TimelineCreateRequest> _timelineCreateRequestValidator;
    private readonly IValidator<JsonPatchDocument<TimelinePatchRequest>> _timelinePatchRequestDocumentValidator;
    private readonly IValidator<TimelinePatchRequest> _timelinePatchRequestValidator;

    private readonly ITimelineRepository _timelineRepository;

    private readonly TimelineMapper _timelineMapper;

    public TimelineController (ITimelineRepository timelineRepository,
                               TimelineMapper timelineMapper)
    {
        _timelineCreateRequestValidator = new TimelineValidators.TimelineCreateRequestValidator ();
        _timelinePatchRequestDocumentValidator = new TimelineValidators.TimelinePatchRequestDocumentValidator ();
        _timelinePatchRequestValidator = new TimelineValidators.TimelinePatchRequestValidator ();

        _timelineRepository = timelineRepository;

        _timelineMapper = timelineMapper;
    }

    [HttpGet ("{timelineID:Guid}")]
    public async Task<ActionResult> FetchTimeline ([FromRoute] Guid boardID,
                                                   [FromRoute] Guid timelineID)
    {
        var timeline = await _timelineRepository.GetTimelineAsync (boardID, timelineID);
        if (timeline is null)
            return BadRequest (ErrorResponseMessages.NotFoundErrorResponse (nameof (Timeline)));

        var timelineResponse = _timelineMapper.MapTimelineToTimelineResponse (timeline);
        return Ok (timelineResponse);
    }

    [HttpPost]
    public async Task<ActionResult> CreateTimeline ([FromRoute] Guid boardID,
                                                    [FromBody] TimelineCreateRequest timelineCreateRequest)
    {
        var validationResult = _timelineCreateRequestValidator.Validate (timelineCreateRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (TimelineCreateRequest), "")
                               + "\n" + validationResult.ToString ());

        var parentExists = await _timelineRepository.ParentExistsAsync (timelineCreateRequest.ParentID.Value, timelineCreateRequest.TimelineTypeID.Value);
        if (parentExists is false)
            return BadRequest (ErrorResponseMessages.NotFoundErrorResponse ("Parent"));

        var newTimeline = _timelineMapper.MapTimelineCreateRequestToTimeline (timelineCreateRequest);
        newTimeline.PartitionKey = boardID.ToString();
        newTimeline.RowKey = Guid.NewGuid ().ToString ();
        newTimeline = TimelineSpecifyKind (newTimeline);

        await _timelineRepository.AddTimelineAsync (newTimeline);
        /*if (databaseResponse.IsError)
            return Problem (ErrorResponseMessages.AddToDatabaseErrorResponse (nameof (Timeline)) + $"\nInternal status: {databaseResponse.Status}");*/

        var timelineResponse = _timelineMapper.MapTimelineToTimelineResponse (newTimeline);
        return Created (default (Uri), timelineResponse);
    }

    [HttpPatch ("{timelineID:Guid}")]
    public async Task<ActionResult> UpdateTimeline ([FromRoute] Guid boardID, 
                                                    [FromRoute] Guid timelineID,
                                                    [FromBody] JsonPatchDocument<TimelinePatchRequest> timelinePatchRequestDocument)
    {
        var validationResult = _timelinePatchRequestDocumentValidator.Validate (timelinePatchRequestDocument);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (TagPatchRequest), validationResult.ToString ()));

        var timelineToUpdateCollection = await _timelineRepository.QueryTimelinesAsync (timeline => timeline.RowKey == timelineID.ToString ());
        if (timelineToUpdateCollection is null || timelineToUpdateCollection.Count () is 0)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Timeline)));
        if (timelineToUpdateCollection.Count is not 1)
            return Problem (ErrorResponseMessages.TooManyEntitiesErrorResponse (nameof (Timeline)));

        var timelineToUpdate = timelineToUpdateCollection.Single ();
        var timelinePatchRequest = _timelineMapper.MapTimelineToTimelinePatchRequest (timelineToUpdate);
        try { timelinePatchRequestDocument.ApplyTo (timelinePatchRequest); }
        catch (JsonPatchException jsonPatchEx)
            { return BadRequest (ErrorResponseMessages.PatchRequestIsInvalidErrorResponse (nameof (Timeline)) + "\nDetails:\n" + jsonPatchEx.Message); }

        validationResult = _timelinePatchRequestValidator.Validate (timelinePatchRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (TagPatchRequest), validationResult.ToString ()));

        var convertedTimelineToUpdate = _timelineMapper.MapTimelinePatchRequestToTimeline (timelinePatchRequest); // Make sure that the response object is preserved if not mapped to
        _timelineMapper.MapFieldsFromSourceToTarget (convertedTimelineToUpdate, timelineToUpdate);

        timelineToUpdate = TimelineSpecifyKind (timelineToUpdate);

        await _timelineRepository.UpdateTimelineAsync (timelineToUpdate);
        /*if (databaseResponse.IsError)
            return Problem (ErrorResponseMessages.UpdateInDatabaseErrorResponse (nameof (Timeline), databaseResponse.Status));*/

        var timelineResponse = _timelineMapper.MapTimelineToTimelineResponse (timelineToUpdate);
        return Ok (timelineResponse);
    }

    [HttpDelete ("{timelineID:guid}")]
    public async Task<ActionResult> DeleteTimwlinw ([FromRoute] Guid boardID, 
                                                    [FromRoute] Guid timelineID)
    {
        var timelineFromDatabase = await _timelineRepository.GetTimelineAsync (boardID, timelineID);

        await _timelineRepository.DeleteTimelineAsync (timelineFromDatabase);

        return Ok ();
    }

    private Timeline TimelineSpecifyKind (Timeline timeline)
    {
        if (timeline.StartPreferenceUTC.HasValue)
            timeline.StartPreferenceUTC = DateTime.SpecifyKind (timeline.StartPreferenceUTC.Value, DateTimeKind.Utc);
        if (timeline.StartDeadlineUTC.HasValue)
            timeline.StartDeadlineUTC = DateTime.SpecifyKind (timeline.StartDeadlineUTC.Value, DateTimeKind.Utc);
        if (timeline.EndPreferenceUTC.HasValue)
            timeline.EndPreferenceUTC = DateTime.SpecifyKind (timeline.EndPreferenceUTC.Value, DateTimeKind.Utc);
        if (timeline.EndDeadlineUTC.HasValue)
            timeline.EndDeadlineUTC = DateTime.SpecifyKind (timeline.EndDeadlineUTC.Value, DateTimeKind.Utc);
        return timeline;
    }
}