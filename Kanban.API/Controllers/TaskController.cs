using Kanban.API.Repositories;
using Kanban.Contracts.Request.Create;
using Kanban.Contracts.Response;
using Microsoft.AspNetCore.Mvc;

namespace Kanban.API.Controllers;

[ApiController]
[Route ("kanban/tasks")]
public class TaskController : Controller
{
    private readonly ITaskRepository _taskRepository;

    public TaskController (ITaskRepository taskRepository)
    {
        _taskRepository = taskRepository;
    }

    [HttpPost ("create")]
    public async Task<ActionResult> CreateTask ([FromBody] TaskCreateRequest taskCreateRequest)
    {
        // Validation later..

        var newTask = new Models.Task
        {
            PartitionKey = Guid.NewGuid ().ToString (),
            RowKey = taskCreateRequest.CardID.ToString (),
            Title = taskCreateRequest.Title,
            TaskTypeID = taskCreateRequest.TaskTypeID,
            DeadlineID = Guid.Empty,//Replace soon!!!
        };

        var addTaskResponse = await _taskRepository.CreateTaskAsync (newTask);
        if (addTaskResponse.IsError)
        {
            //We might want to have better verification later for failures. I'm thinking we actually query the table and grab the card so we can map it to a response object
            return StatusCode (StatusCodes.Status500InternalServerError, $"Could not insert a new task into database. Internal status: {addTaskResponse.Status}");
        }

        //var taskType = _taskRepository.GetTaskTypeAsync (newTask.TaskTypeID, );
        // For later..

        var taskResponse = new TaskResponse
        {
            Title = newTask.Title,
            TaskType = "Placehlder"//Fix later..
        };

        return StatusCode (StatusCodes.Status201Created, taskResponse);
    }

    [HttpGet ("types/fetch")]
    public async Task<ActionResult> FetchTaskTypes ()
    {
        var taskTypes = await _taskRepository.GetTaskTypesAsync (taskType => true);

        var taskTypeListReponse = new TaskTypesResponse { Titles = new List<string> () };
        foreach (var taskType in taskTypes)
            taskTypeListReponse.Titles.Add (taskType.Title);

        return StatusCode (StatusCodes.Status200OK, taskTypeListReponse);
    }
}