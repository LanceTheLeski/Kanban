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

namespace ArcStrides.API.Controllers;

[ApiController]
[Route ("ArcStrides/timelines")]
public class TimelineController : Controller
{
    private readonly IValidator<TimelineCreateRequest> _timelineCreateRequestValidator;
    private readonly IValidator<JsonPatchDocument<TimelinePatchRequest>> _timelinePatchRequestDocumentValidator;
    private readonly IValidator<TimelinePatchRequest> _timelinePatchRequestValidator;

    private readonly ITimelineRepository _timelineRepository;

    private readonly ITimelineMapper _timelineMapper;

    public TimelineController (IValidator<TimelineCreateRequest> timelineCreateRequestValidator,
                               IValidator<JsonPatchDocument<TimelinePatchRequest>> timelinePatchRequestDocumentValidator,
                               IValidator<TimelinePatchRequest> timelinePatchRequestValidator,
                               ITimelineRepository timelineRepository,
                               ITimelineMapper timelineMapper)
    {
        _timelineCreateRequestValidator = timelineCreateRequestValidator;
        _timelinePatchRequestDocumentValidator = timelinePatchRequestDocumentValidator;
        _timelinePatchRequestValidator = timelinePatchRequestValidator;

        _timelineRepository = timelineRepository;

        _timelineMapper = timelineMapper;
    }

    [HttpGet ("{ID:Guid}")]
    public async Task<ActionResult> FetchTimeline ([FromRoute] Guid ID)
    {
        var timelineCollection = await _timelineRepository.QueryTimelinesAsync (timeline => timeline.PartitionKey == ID.ToString ());
        if (timelineCollection.Count () is 0)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Timeline)));
        if (timelineCollection.Count () is not 1)
            return Problem (ErrorResponseMessages.TooManyEntitiesErrorResponse (nameof (Timeline)));

        var timelineToReturn = timelineCollection.Single ();
        var timelineResponse = _timelineMapper.MapTimelineToTimelineResponse (timelineToReturn);
        return Ok (timelineResponse);
    }

    [HttpPost]
    public async Task<ActionResult> CreateTimeline ([FromBody] TimelineCreateRequest timelineCreateRequest)
    {
        var validationResult = _timelineCreateRequestValidator.Validate (timelineCreateRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (TimelineCreateRequest), "")
                               + "\n" + validationResult.ToString ());

        var parentExists = await _timelineRepository.ParentExistsAsync (timelineCreateRequest.ParentID.Value, timelineCreateRequest.TimelineTypeID.Value);
        if (parentExists is false)
            return BadRequest (ErrorResponseMessages.NotFoundErrorResponse ("Parent"));

        var newTimeline = _timelineMapper.MapTimelineCreateRequestToTimeline (timelineCreateRequest);
        newTimeline.PartitionKey = Guid.NewGuid ().ToString ();

        await _timelineRepository.AddTimelineAsync (newTimeline);
        /*if (databaseResponse.IsError)
            return Problem (ErrorResponseMessages.AddToDatabaseErrorResponse (nameof (Timeline)) + $"\nInternal status: {databaseResponse.Status}");*/

        var timelineResponse = _timelineMapper.MapTimelineToTimelineResponse (newTimeline);
        return Created (default (Uri), timelineResponse);
    }

    [HttpPatch ("{ID:Guid}")]
    public async Task<ActionResult> UpdateTimeline ([FromRoute] Guid ID, [FromBody] JsonPatchDocument<TimelinePatchRequest> timelinePatchRequest)
    {
        var validationResult = _timelinePatchRequestDocumentValidator.Validate (timelinePatchRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (TagPatchRequest), validationResult.ToString ()));

        var timelineToUpdateCollection = await _timelineRepository.QueryTimelinesAsync (timeline => timeline.PartitionKey == ID.ToString ());
        if (timelineToUpdateCollection is null || timelineToUpdateCollection.Count is 0)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Timeline)));
        if (timelineToUpdateCollection.Count is not 1)
            return Problem (ErrorResponseMessages.TooManyEntitiesErrorResponse (nameof (Timeline)));

        var timelineToUpdate = timelineToUpdateCollection.Single ();
        var convertedTimelineToUpdate = _timelineMapper.MapTimelineToTimelinePatchRequest (timelineToUpdate);
        try { timelinePatchRequest.ApplyTo (convertedTimelineToUpdate); }
        catch (JsonPatchException jsonPatchEx)
        { return BadRequest (ErrorResponseMessages.PatchRequestIsInvalidErrorResponse (nameof (Timeline)) + "\nDetails:\n" + jsonPatchEx.Message); }

        validationResult = _timelinePatchRequestValidator.Validate (convertedTimelineToUpdate);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (TagPatchRequest), validationResult.ToString ()));

        timelineToUpdate = _timelineMapper.MapTimelinePatchRequestToTimeline (convertedTimelineToUpdate); // Make sure that the response object is preserved if not mapped to
        await _timelineRepository.UpdateTimelineAsync (timelineToUpdate);
        /*if (databaseResponse.IsError)
            return Problem (ErrorResponseMessages.UpdateInDatabaseErrorResponse (nameof (Timeline), databaseResponse.Status));*/

        var timelineResponse = _timelineMapper.MapTimelineToTimelineResponse (timelineToUpdate);
        return Ok (timelineResponse);
    }

    [HttpDelete ("{ID:guid}")]
    public async Task<ActionResult> DeleteTimwlinw (Guid ID)
    {
        var timelineCollection = await _timelineRepository.QueryTimelinesAsync (timeline => timeline.PartitionKey == ID.ToString ());
        if (timelineCollection.Count is 0)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Timeline)));
        if (timelineCollection.Count is not 1)
            return Problem (ErrorResponseMessages.TooManyEntitiesErrorResponse (nameof (Timeline)));

        var timelineFromDatabase = timelineCollection.Single ();
        await _timelineRepository.DeleteTimelineAsync (timelineFromDatabase);
        /*if (databaseResponse.IsError)
            return Problem (ErrorResponseMessages.RemoveFromDatabaseErrorResponse (nameof (Timeline)));*/

        return Ok ();
    }
}