using Azure.Data.Tables;
using Kanban.API.Models;
using Kanban.API.Options;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public class TaskRepository : ITaskRepository
{
    private const string tasks = "Tasks";
    private const string taskTypes = "TaskTypes";
    private const string timelines = "Timelines";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _taskTable;
    private readonly TableClient _taskTypeTable;
    private readonly TableClient _timelineTable;

    public TaskRepository (IOptions<CosmosOptions> cosmosOptions)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _taskTable = _tableServiceClient.GetTableClient (tableName: tasks);
        _taskTypeTable = _tableServiceClient.GetTableClient (tableName: taskTypes);
        _timelineTable = _tableServiceClient.GetTableClient (tableName: timelines);
    }

    #region Task

    public async Task<Models.Task?> GetTaskAsync (Guid timelineID, Guid tagGroupID)
    {
        var response = await _taskTable.GetEntityAsync<Models.Task> (partitionKey: timelineID.ToString (), rowKey: tagGroupID.ToString ());
        return response?.Value.GetType () == typeof (Models.Task) ?
            response.Value :
            null;
    }

    public async Task<Azure.Response> UpdateTaskAsync (Models.Task taskToUpdate)
        => await _taskTable.UpdateEntityAsync (taskToUpdate, Azure.ETag.All);

    public async Task<Collection<Models.Task>> QueryTasksAsync (Expression<Func<Models.Task, bool>> taskQueryExpression)
    {
        var taskCollection = new Collection<Models.Task> ();

        var taskFromTable = _taskTable.QueryAsync (taskQueryExpression); //This seems to fail with certain expressions
        await foreach (var task in taskFromTable)
            taskCollection.Add (task);

        return taskCollection;
    }

    public async Task<Azure.Response> CreateTaskAsync (Models.Task taskToCreate)
        => await _taskTable.AddEntityAsync (taskToCreate);

    #endregion Task

    #region Task Type

    public async Task<Collection<TaskType>> GetTaskTypesAsync (Expression<Func<TaskType, bool>> taskTypeQueryExpression)
    {
        var taskTypeCollection = new Collection<TaskType> ();

        var taskTypeFromTable = _taskTypeTable.QueryAsync (taskTypeQueryExpression);
        await foreach (var taskType in taskTypeFromTable)
            taskTypeCollection.Add (taskType);

        return taskTypeCollection;
    }

    #endregion Task Type

    #region Task Group

    public async Task<TaskType?> GetTaskTypeAsync (Guid taskTypeID, Guid tagGroupID)
    {
        var response = await _taskTable.GetEntityAsync<TaskType> (partitionKey: taskTypeID.ToString (), rowKey: tagGroupID.ToString ());
        return response?.Value.GetType () == typeof (TaskType) ?
            response.Value :
            null;
    }

    #endregion Task Group

    #region Timeline

    public async Task<Timeline?> GetTimelineAsync (Guid timelineID, Guid taskID)
    {
        var response = await _timelineTable.GetEntityAsync<Timeline> (partitionKey: timelineID.ToString (), rowKey: taskID.ToString ());
        return response?.Value.GetType () == typeof (Timeline) ?
            response.Value :
            null;
    }

    public async Task<Collection<Timeline>> QueryTimelinesAsync (Expression<Func<Timeline, bool>> timelineQueryExpression)
    {
        var timelineCollection = new Collection<Timeline> ();

        var timelinesFromTable = _timelineTable.QueryAsync (timelineQueryExpression); //This seems to fail with certain expressions
        await foreach (var timeline in timelinesFromTable)
            timelineCollection.Add (timeline);

        return timelineCollection;
    }

    public async Task<Azure.Response> CreateTimelineAsync (Timeline timelineToCreate)
        => await _timelineTable.AddEntityAsync (timelineToCreate);

    #endregion Timeline
}