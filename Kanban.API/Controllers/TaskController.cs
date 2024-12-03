using FluentValidation;
using Kanban.API.Components;
using Kanban.API.Mappers;
using Kanban.API.Models;
using Kanban.API.Repositories;
using Kanban.Contracts.Request.Create;
using Kanban.Contracts.Request.Query;
using Kanban.Contracts.Response;
using Microsoft.AspNetCore.Mvc;

namespace Kanban.API.Controllers;

[ApiController]
[Route ("kanban/tasks")]
public class TaskController : Controller
{
    private readonly IValidator<TaskQueryParameters> _taskQueryParametersValidator;
    private readonly IValidator<TaskCreateRequest> _taskCreateRequestValidator;

    private readonly ITaskRepository _taskRepository;
    private readonly ITaskTypeRepository _taskTypeRepository;
    private readonly ITimelineRepository _timelineRepository;

    private readonly ITaskMapper _taskMapper;

    public TaskController (IValidator<TaskQueryParameters> taskQueryParametersValidator,
                           IValidator<TaskCreateRequest> taskCreateRequestValidator,
                           ITaskRepository taskRepository,
                           ITaskTypeRepository taskTypeRepository, 
                           ITimelineRepository timelineRepository,
                           ITaskMapper taskMapper)
    {
        _taskQueryParametersValidator = taskQueryParametersValidator;
        _taskCreateRequestValidator = taskCreateRequestValidator;

        _taskRepository = taskRepository;
        _taskTypeRepository = taskTypeRepository;
        _timelineRepository = timelineRepository;

        _taskMapper = taskMapper;
    }

    [HttpGet]
    public async Task<ActionResult> FetchTasks ([FromQuery] TaskQueryParameters taskQueryParameters)
    {
        var validationResult = _taskQueryParametersValidator.Validate (taskQueryParameters);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (TaskQueryParameters))
                               + "\n" + validationResult.ToString ());

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
            taskListReponse.Add (new TaskResponse 
            { 
                Title = task.Title,
                TaskTypeID = task.TaskTypeID,
                TaskTypeTitle = "Placeholder",
                isCompleted = task.IsComplete
            });

        return Ok (taskListReponse);
    }

    [HttpPost]
    public async Task<ActionResult> CreateTask ([FromBody] TaskCreateRequest taskCreateRequest)
    {
        var validationResult = _taskCreateRequestValidator.Validate (taskCreateRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (TaskCreateRequest))
                               + "\n" + validationResult.ToString ());

        var newTask = _taskMapper.MapTaskCreateRequestToTask (taskCreateRequest);
        newTask.PartitionKey = Guid.NewGuid ().ToString ();

        var databaseResponse = await _taskRepository.AddTaskAsync (newTask);
        if (databaseResponse.IsError)
            return Problem (ErrorResponseMessages.AddToDatabaseErrorResponse (nameof (Models.Task)) + $"\nInternal status: {databaseResponse.Status}");

        var taskTypeCollection = await _taskTypeRepository.QueryTaskTypesAsync (taskType => taskType.PartitionKey == taskCreateRequest.TaskTypeID.ToString ());
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
        var taskTypes = await _taskTypeRepository.QueryTaskTypesAsync (taskType => true);

        var taskTypeListReponse = new TaskTypesResponse { Titles = new List<string> () };
        foreach (var taskType in taskTypes)
            taskTypeListReponse.Titles.Add (taskType.Title);

        return Ok (taskTypeListReponse);
    }
}