using ArcStrides.API.Exceptions;
using ArcStrides.API.Mappers;
using ArcStrides.API.Messages;
using ArcStrides.API.Models;
using ArcStrides.API.Models.TagGroup;
using ArcStrides.API.Repositories;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Request.Query;
using ArcStrides.Contracts.Response;
using Azure;
using Azure.Data.Tables;
using DeepCopy;
using FluentValidation;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.JsonPatch.Exceptions;
using Microsoft.AspNetCore.Mvc;

using static ArcStrides.API.Validators.TaskValidators;

namespace ArcStrides.API.Controllers;

[ApiController]
[Route ("arcstrides/boards/{boardID:guid}/cards/{cardID:guid}/tasks")]
public class TaskController : ArcController
{
    private readonly IValidator<TaskQueryParameters> _taskQueryParametersValidator;
    private readonly IValidator<TaskCreateRequest> _taskCreateRequestValidator;

    private readonly ITaskRepository _taskRepository;
    private readonly ITimelineRepository _timelineRepository;

    private readonly TaskMapper _taskMapper;

    public TaskController (ITaskRepository taskRepository,
                           ITimelineRepository timelineRepository,
                           TaskMapper taskMapper)
    {
        _taskQueryParametersValidator = new TaskQueryParametersValidator ();
        _taskCreateRequestValidator = new TaskCreateRequestValidator ();

        _taskRepository = taskRepository;
        _timelineRepository = timelineRepository;

        _taskMapper = taskMapper;
    }

    [HttpGet]
    public async Task<ActionResult> FetchTask ([FromRoute] Guid boardGuid, 
                                               [FromRoute] Guid cardGuid, 
                                               [FromQuery] TaskQueryParameters taskQueryParameters)
    {
        var validationResult = _taskQueryParametersValidator.Validate (taskQueryParameters);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (TaskQueryParameters), validationResult.ToString ()));

        try
        {
            Func<Models.Board.Task, bool> taskQuery = task => true;
            if (string.IsNullOrWhiteSpace (taskQueryParameters.CardIDs) is false)
            {
                var cardIDCollection = taskQueryParameters.CardIDs.Split (',')
                                                                  .Select (Guid.Parse);

                taskQuery = _taskRepository.BuildTaskQuery (cardIDCollection!);
            }

            var taskCollection = await _taskRepository.QueryTasksAsync (task => taskQuery (task));

            // Need a way to wrap a list of responses.
            var taskListReponse = new List<TaskResponse> ();
            foreach (var task in taskCollection)
                taskListReponse.Add (_taskMapper.MapTaskToTaskResponse (task));

            return Ok (taskListReponse);
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    [HttpPost]
    public async Task<ActionResult> CreateTask ([FromRoute] Guid boardID,
                                                [FromRoute] Guid cardID, 
                                                [FromBody] TaskCreateRequest taskCreateRequest)
    {
        var validationResult = _taskCreateRequestValidator.Validate (taskCreateRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (TaskCreateRequest), "")
                               + "\n" + validationResult.ToString ());

        try
        {
            var newTask = _taskMapper.MapTaskCreateRequestToTask (taskCreateRequest);
            newTask.PartitionKey = Guid.NewGuid ().ToString ();
            newTask.RowKey = cardID.ToString ();

            await _taskRepository.AddTaskAsync (newTask);

            var taskTypeCollection = await _taskRepository.QueryTaskTypesAsync (taskType => taskType.PartitionKey == taskCreateRequest.TaskTypeID.ToString ());
            if (taskTypeCollection.Count is 0)
                return BadRequest (ErrorResponseMessages.FieldDoesNotExistInDatabaseErrorResponse (nameof (Models.Board.Task.TaskTypeID)));
            if (taskTypeCollection.Count is not 1)
                return Problem (ErrorResponseMessages.TooManyEntitiesErrorResponse (nameof (TaskType)));

            var taskResponse = _taskMapper.MapTaskToTaskResponse (newTask);
            return Created (default (Uri), taskResponse);
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    [HttpPatch ("{taskID:guid}")]
    public async Task<ActionResult> UpdateTask ([FromRoute] Guid boardID,
                                                [FromRoute] Guid cardID,
                                                [FromRoute] Guid taskID,
                                                [FromBody] JsonPatchDocument<TaskPatchRequest> taskPatchRequest)
    {
        try
        {
            var tasksFromDatabase = await FetchAndValidateAllExistingTasksAsync (boardID, cardID);

            var taskToUpdate = tasksFromDatabase.FirstOrDefault (task => task.RowKey == taskID.ToString ());
            if (taskToUpdate is null)
                return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Models.Board.Task)));

            var convertedTaskToUpdate = _taskMapper.MapTaskToTaskPatchRequest (taskToUpdate);
            try { taskPatchRequest.ApplyTo (convertedTaskToUpdate); }
            catch (JsonPatchException)
                { return BadRequest (ErrorResponseMessages.PatchRequestIsInvalidErrorResponse (nameof (Models.Board.Task))); }
            ValidateConvertedTaskAgainstExistingTasks (taskToUpdate, convertedTaskToUpdate, tasksFromDatabase);

            var updatedTask = await UpdateTaskAndUpdateEffectedTasks (boardID, taskToUpdate, convertedTaskToUpdate, tasksFromDatabase, taskPatchRequest.Operations);

            var taskResponse = _taskMapper.MapTaskToTaskResponse (updatedTask);
            return Ok (taskResponse);
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    [HttpGet ("/arcstrides/tasks/types")]
    public async Task<ActionResult> FetchTaskType ()
    {
        try 
        {
            var taskTypes = await _taskRepository.QueryTaskTypesAsync (taskType => true);

            var taskTypeReponseList = new List<TaskTypeResponse> ();
            foreach (var taskType in taskTypes)
                taskTypeReponseList.Add (_taskMapper.MapTaskTypeToTaskTypeResponse (taskType));

            return Ok (taskTypeReponseList);
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    [HttpPost ("/arcstrides/tasks/types")]
    public async Task<ActionResult> CreateTaskTypes ([FromBody] TaskTypeCreateRequest taskTypeCreateRequest)
    {
        try 
        {
            // Validate..

            var taskTypeToAdd = _taskMapper.MapTaskTypeCreateRequestToTaskType (taskTypeCreateRequest);

            await _taskRepository.AddTaskTypeAsync (taskTypeToAdd);

            var taskTypeResponse = _taskMapper.MapTaskTypeToTaskTypeResponse (taskTypeToAdd);

            return Created (default (Uri)/*Generate this later*/, taskTypeResponse);
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    [HttpPatch ("/arcstrides/tasks/types/{taskTypeID:int}")]
    public async Task<ActionResult> UpdateTaskType ([FromRoute] int taskTypeID, 
                                                    [FromBody] JsonPatchDocument<TaskTypePatchRequest> taskTypePatchRequest)
    {
        try
        {
            var taskTypeFromDatabase = await FetchAndValidateExistingTaskType (taskTypeID);
            if (taskTypeFromDatabase is null)
                return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Models.Board.Task)));

            var convertedTaskTypeToUpdate = _taskMapper.MapTaskTypeToTaskTypePatchRequest (taskTypeFromDatabase);
            try { taskTypePatchRequest.ApplyTo (convertedTaskTypeToUpdate); }
            catch (JsonPatchException)
                { return BadRequest (ErrorResponseMessages.PatchRequestIsInvalidErrorResponse (nameof (Models.Board.Task))); }

            var convertedTaskType = _taskMapper.MapTaskTypePatchRequestToTaskType (convertedTaskTypeToUpdate);
            _taskMapper.MapFieldsFromSourceToTarget (convertedTaskType, taskTypeFromDatabase);

            await _taskRepository.UpdateTaskTypeAsync (taskTypeFromDatabase);

            var taskTypeResponse = _taskMapper.MapTaskTypeToTaskTypeResponse (taskTypeFromDatabase);
            return Ok (taskTypeResponse);
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    /// <summary>
    /// Attempts to fetch a collection of tasks that are all associated to 
    /// a card by that card's ID. Also tries to match thw board ID for better
    /// precision.
    /// </summary>
    private async Task<IEnumerable<Models.Board.Task>> FetchAndValidateAllExistingTasksAsync (Guid boardID, Guid cardID)
    {
        try 
        { 
            return await _taskRepository.QueryTasksAsync (task => task.PartitionKey == boardID.ToString ()
                                                                  && task.CardID == cardID); 
        }
        catch (RequestFailedException reqFailedEx)
            { throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.FetchFromDatabaseErrorResponse (nameof (Models.Board.Task), reqFailedEx.Status)); }
    }

    /// <summary>
    /// Validates that the fields on the converted task are valid. Specifically 
    /// that the order is in bounds.
    /// </summary>
    private void ValidateConvertedTaskAgainstExistingTasks (Models.Board.Task taskToUpdate,
                                                            TaskPatchRequest convertedTaskToUpdate,
                                                            IEnumerable<Models.Board.Task> tasksFromBoard)
    {
        if (convertedTaskToUpdate.Order < 0
            || convertedTaskToUpdate.Order >= tasksFromBoard.Count ())
            throw new RequestFailureWrapperException (nameof (BadRequest), ErrorResponseMessages.ValidationFailedErrorResponse (nameof (Models.Board.Task), ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (Models.Board.Task.TaskOrder))));
    }

    /// <summary>
    /// Executes a transaction to:
    /// <list type="bullet">
    ///     <item>Update any effected task order due to the chosen task moving.</item>
    ///     <item>Update the chosen task.</item>
    /// </list>
    /// </summary>
    private async Task<Models.Board.Task> UpdateTaskAndUpdateEffectedTasks (Guid boardID,
                                                                            Models.Board.Task taskToUpdate,
                                                                            TaskPatchRequest convertedTaskPatchRequest,
                                                                            IEnumerable<Models.Board.Task> tasksFromBoard,
                                                                            IEnumerable<Microsoft.AspNetCore.JsonPatch.Operations.Operation<TaskPatchRequest>> taskPatchRequest) 
    {
        var updateTaskTransaction = new ArcTransaction ();

        var orderIsUpdated = taskPatchRequest.Any (operation => string.Equals (operation.path, $"/{nameof (TaskPatchRequest.Order)}", StringComparison.OrdinalIgnoreCase));
        if (orderIsUpdated)
            updateTaskTransaction = _taskRepository.ApplyNewOrderForExistingTasks (taskToUpdate, convertedTaskPatchRequest.Order.Value, tasksFromBoard, updateTaskTransaction);

        var originalTask = DeepCopier.Copy (taskToUpdate);
        var convertedTaskToUpdate = _taskMapper.MapTaskPatchRequestToTask (convertedTaskPatchRequest);
        _taskMapper.MapFieldsFromSourceToTarget (convertedTaskToUpdate, taskToUpdate);

        var allUpdatedColumns = updateTaskTransaction.GetTransactionEntities<Models.Board.Task> ().ToList ();
        allUpdatedColumns.Add (taskToUpdate);

        var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, taskToUpdate);
        updateTaskTransaction.Add (transaction, originalTask);

        try { await _taskRepository.SubmitArcTransactionAsync (updateTaskTransaction); }
        catch (RequestFailedException reqFailedEx)
            { throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.UpdateInDatabaseErrorResponse (nameof (Models.Board.Task), reqFailedEx.Status)); }

        return taskToUpdate;
    }

    /// <summary>
    /// Attempts to fetch a collection of tasks that are all associated to 
    /// a card by that card's ID. Also tries to match thw board ID for better
    /// precision.
    /// </summary>
    private async Task<TaskType?> FetchAndValidateExistingTaskType (int taskTypeID)
    {
        try
        {
            var taskTypes = await _taskRepository.QueryTaskTypesAsync (taskType => taskType.RowKey == taskTypeID.ToString ());
            return taskTypes.SingleOrDefault ();
        }
        catch (RequestFailedException reqFailedEx)
            { throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.FetchFromDatabaseErrorResponse (nameof (Models.Board.Task), reqFailedEx.Status)); }
    }
}