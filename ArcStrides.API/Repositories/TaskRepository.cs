using ArcStrides.API.Models.TagGroup;
using ArcStrides.API.Options;
using ArcStrides.API.Services;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Repositories;

public class TaskRepository : ITaskRepository
{
    private const string tasks = "Tasks";
    private const string taskTypes = "TaskTypes";

    private readonly AzureTableService<Models.Board.Task> _taskTable;
    private readonly AzureTableService<TaskType> _taskTypeTable;

    public TaskRepository (IOptions<AzureTableOptions> azureTableOptions)
    {
        _taskTable = new AzureTableService<Models.Board.Task> (tasks, azureTableOptions);
        _taskTypeTable = new AzureTableService<TaskType> (taskTypes, azureTableOptions);
    }

    #region Task

    public async Task<Models.Board.Task?> GetTaskAsync (Guid timelineID, Guid tagGroupID)
        => await _taskTable.GetEntityAsync (timelineID, tagGroupID);

    public async Task<Collection<Models.Board.Task>> GetTasksAsync (Guid taskID)
        => await _taskTable.GetEntitiesAsync (taskID);

    public async Task<Collection<Models.Board.Task>> QueryTasksAsync (Expression<Func<Models.Board.Task, bool>> taskQueryExpression)
        => await _taskTable.QueryEntitiesAsync (taskQueryExpression);

    public async Task AddTaskAsync (Models.Board.Task taskToCreate)
        => await _taskTable.AddEntityAsync (taskToCreate);

    public async Task UpdateTaskAsync (Models.Board.Task taskToUpdate)
        => await _taskTable.UpdateEntityAsync (taskToUpdate);

    public Func<Models.Board.Task, bool> BuildTaskQuery (IEnumerable<Guid> cardIDCollection)
    {
        //This all seems odd. I feel like it'll fail but we'll see.
        Func<Models.Board.Task, bool> taskQuery = task => false;

        foreach (var cardID in cardIDCollection)
        {
            Func<Models.Board.Task, bool> expr = task => task.RowKey == cardID.ToString ();
            taskQuery = task => taskQuery (task) || expr (task);
        }

        return taskQuery;
    }

    #endregion Task

    #region Task Type

    public async Task<TaskType?> GetTaskTypeAsync (int taskTypeID, Guid tagGroupID)
        => await _taskTypeTable.GetEntityAsync (taskTypeID, tagGroupID);

    public async Task<Collection<TaskType>> GetTaskTypesAsync (int taskTypeID)
        => await _taskTypeTable.GetEntitiesAsync (taskTypeID);

    public async Task<Collection<TaskType>> QueryTaskTypesAsync (Expression<Func<TaskType, bool>> taskTypeQueryExpression)
        => await _taskTypeTable.QueryEntitiesAsync (taskTypeQueryExpression);

    #endregion Task Type
}