using ArcStrides.API.Mappers;
using ArcStrides.API.Messages;
using ArcStrides.API.Models;
using ArcStrides.API.Repositories;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Query;
using ArcStrides.Contracts.Response;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace ArcStrides.API.Controllers;

[ApiController]
[Route ("arcstrides/tasks")]
public class TaskController : Controller
{
    private readonly IValidator<TaskQueryParameters> _taskQueryParametersValidator;
    private readonly IValidator<TaskCreateRequest> _taskCreateRequestValidator;

    private readonly ITaskRepository _taskRepository;
    private readonly ITimelineRepository _timelineRepository;

    private readonly ITaskMapper _taskMapper;

    public TaskController (IValidator<TaskQueryParameters> taskQueryParametersValidator,
                           IValidator<TaskCreateRequest> taskCreateRequestValidator,
                           ITaskRepository taskRepository,
                           ITimelineRepository timelineRepository,
                           ITaskMapper taskMapper)
    {
        _taskQueryParametersValidator = taskQueryParametersValidator;
        _taskCreateRequestValidator = taskCreateRequestValidator;

        _taskRepository = taskRepository;
        _timelineRepository = timelineRepository;

        _taskMapper = taskMapper;
    }

    [HttpGet]
    public async Task<ActionResult> FetchTasks ([FromQuery] TaskQueryParameters taskQueryParameters)
    {
        var validationResult = _taskQueryParametersValidator.Validate (taskQueryParameters);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (TaskQueryParameters), ""));

        Func<Models.Task, bool> taskQuery = task => true;
        if (string.IsNullOrWhiteSpace (taskQueryParameters.CardIDs) is false)
        {
            var cardIDCollection = taskQueryParameters.CardIDs.Split (',')
                                                              .Select (Guid.Parse);

            taskQuery = _taskRepository.BuildTaskQuery (cardIDCollection!);
        }

        var taskCollection = await _taskRepository.QueryTasksAsync (task => taskQuery(task));
        
        // Need a way to wrap a list of responses.
        var taskListReponse = new List<TaskResponse> ();
        foreach (var task in taskCollection)
            taskListReponse.Add (_taskMapper.MapTaskToTaskResponse (task));

        return Ok (taskListReponse);
    }

    [HttpPost]
    public async Task<ActionResult> CreateTask ([FromBody] TaskCreateRequest taskCreateRequest)
    {
        var validationResult = _taskCreateRequestValidator.Validate (taskCreateRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (TaskCreateRequest), "")
                               + "\n" + validationResult.ToString ());

        var newTask = _taskMapper.MapTaskCreateRequestToTask (taskCreateRequest);
        newTask.PartitionKey = Guid.NewGuid ().ToString ();

        await _taskRepository.AddTaskAsync (newTask);
        /*if (databaseResponse.IsError)
            return Problem (ErrorResponseMessages.AddToDatabaseErrorResponse (nameof (Models.Task)) + $"\nInternal status: {databaseResponse.Status}");*/

        var taskTypeCollection = await _taskRepository.QueryTaskTypesAsync (taskType => taskType.PartitionKey == taskCreateRequest.TaskTypeID.ToString ());
        if (taskTypeCollection.Count is 0)
            return BadRequest (ErrorResponseMessages.FieldDoesNotExistInDatabaseErrorResponse (nameof (Models.Task.TaskTypeID)));
        if (taskTypeCollection.Count is not 1)
            return Problem (ErrorResponseMessages.TooManyEntitiesErrorResponse (nameof (TaskType)));

        var taskResponse = _taskMapper.MapTaskToTaskResponse (newTask);
        return Created (default (Uri), taskResponse);
    }

    //Redo this one day..
    [HttpGet ("types")]
    public async Task<ActionResult> FetchTaskTypes ()
    {
        var taskTypes = await _taskRepository.QueryTaskTypesAsync (taskType => true);

        var taskTypeListReponse = new TaskTypesResponse { Titles = new List<string> () };
        foreach (var taskType in taskTypes)
            taskTypeListReponse.Titles.Add (taskType.Title);

        return Ok (taskTypeListReponse);
    }
}