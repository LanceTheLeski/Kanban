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
    private readonly ITaskTypeRepository _taskTypeRepository;
    private readonly ITimelineRepository _timelineRepository;

    public TaskController (ITaskRepository taskRepository,
                           ITaskTypeRepository taskTypeRepository, 
                           ITimelineRepository timelineRepository)
    {
        _taskRepository = taskRepository;
        _taskTypeRepository = taskTypeRepository;
        _timelineRepository = timelineRepository;
    }

    [HttpGet]
    public async Task<ActionResult> FetchTasks ([FromQuery] Guid? cardID)
    {
        var tasks = await _taskRepository.QueryTasksAsync (task => task.RowKey == cardID.ToString ());
        
        var taskListReponse = new List<TaskResponse> ();
        foreach (var task in tasks)
            taskListReponse.Add (new TaskResponse 
            { 
                Title = task.Title,
                TaskTypeID = task.TaskTypeID,
                TaskTypeTitle = "Placeholder",
                isCompleted = task.IsComplete
            });

        return StatusCode (StatusCodes.Status200OK, taskListReponse);
    }

    [HttpPost]
    public async Task<ActionResult> CreateTask ([FromBody] TaskCreateRequest taskCreateRequest)
    {
        // Validation later..

        var newTask = new Models.Task
        {
            PartitionKey = Guid.NewGuid ().ToString (),
            RowKey = taskCreateRequest.CardID.ToString (),
            Title = taskCreateRequest.Title,
            TaskTypeID = taskCreateRequest.TaskTypeID,
            TimelineID = Guid.Empty,//Replace soon!!!
        };

        var addTaskResponse = await _taskRepository.AddTaskAsync (newTask);
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
            TaskTypeTitle = "Placehlder"//Fix later..
        };

        return StatusCode (StatusCodes.Status201Created, taskResponse);
    }

    [HttpGet ("types")]
    public async Task<ActionResult> FetchTaskTypes ()
    {
        var taskTypes = await _taskTypeRepository.QueryTaskTypesAsync (taskType => true);

        var taskTypeListReponse = new TaskTypesResponse { Titles = new List<string> () };
        foreach (var taskType in taskTypes)
            taskTypeListReponse.Titles.Add (taskType.Title);

        return StatusCode (StatusCodes.Status200OK, taskTypeListReponse);
    }

    [HttpGet ("{TaskID:Guid}/timelines/{ID:Guid}")]
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

    [HttpPost ("{TaskID:Guid}/timelines")]
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