using ArcStrides.API.Models;
using ArcStrides.API.Models.TagGroup;
using ArcStrides.API.Options;
using ArcStrides.API.Services;
using Azure.Data.Tables;
using DeepCopy;
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

    public async Task<Models.Board.Task?> GetTaskAsync (Guid boardID, Guid taskID)
        => await _taskTable.GetEntityAsync (boardID, taskID);

    public async Task<Collection<Models.Board.Task>> GetTasksAsync (Guid boardID)
        => await _taskTable.GetEntitiesAsync (boardID);

    public async Task<Collection<Models.Board.Task>> QueryTasksAsync (Expression<Func<Models.Board.Task, bool>> taskQueryExpression)
        => await _taskTable.QueryEntitiesAsync (taskQueryExpression);

    public async Task AddTaskAsync (Models.Board.Task taskToCreate)
        => await _taskTable.AddEntityAsync (taskToCreate);

    public async Task UpdateTaskAsync (Models.Board.Task taskToUpdate)
        => await _taskTable.UpdateEntityAsync (taskToUpdate);

    public Func<Models.Board.Task, bool> BuildTaskQuery (IEnumerable<Guid> cardIDCollection)
    {
        // This all seems odd. I feel like it'll fail but we'll see.
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

    public async Task<TaskType?> GetTaskTypeAsync (Guid tagGroupID, int taskTypeID)
        => await _taskTypeTable.GetEntityAsync (tagGroupID, taskTypeID);

    public async Task<Collection<TaskType>> GetTaskTypesAsync (Guid tagGroupID)
        => await _taskTypeTable.GetEntitiesAsync (tagGroupID);

    public async Task<Collection<TaskType>> QueryTaskTypesAsync (Expression<Func<TaskType, bool>> taskTypeQueryExpression)
        => await _taskTypeTable.QueryEntitiesAsync (taskTypeQueryExpression);

    public async Task AddTaskTypeAsync (TaskType taskTypeToCreate)
        => await _taskTypeTable.AddEntityAsync (taskTypeToCreate);

    public async Task UpdateTaskTypeAsync (TaskType taskTypeToUpdate)
        => await _taskTypeTable.UpdateEntityAsync (taskTypeToUpdate);

    #endregion Task Type

    public async Task<bool> SubmitArcTransactionAsync (ArcTransaction arcTransaction)
        => await _taskTable.SubmitArcTransactionAsync (arcTransaction);

    /// <summary>
    /// Renumbers a card's tasks round one moved to <paramref name="newTaskOrder"/>:
    /// the others in their order, the moved one put in at its new place, and every
    /// task whose number that changes written with its new one.
    /// </summary>
    /// <remarks>
    /// It used to walk the places between the old and the new one, looking each up
    /// with <c>Single (task => task.TaskOrder == index)</c>, so it needed the card's
    /// orders to be exactly 0 to n−1. A gap or a repeat threw, and the card could
    /// never be reordered again — and deleting a task made them, on every other card
    /// of the board, until DeleteTask was fixed. Reading the order the tasks are in,
    /// ties broken by ID, and numbering all of them from it works from any numbering
    /// and leaves a broken one mended.
    ///
    /// The moved task's own number is written by the caller, with the rest of its patch.
    /// </remarks>
    public ArcTransaction ApplyNewOrderForExistingTasks (Models.Board.Task taskToUpdate, int newTaskOrder, IEnumerable<Models.Board.Task> taskEnumerable, ArcTransaction arcTransaction)
    {
        var ordered = taskEnumerable.Where (task => task.RowKey != taskToUpdate.RowKey)
                                    .OrderBy (task => task.TaskOrder ?? int.MaxValue)
                                    .ThenBy (task => task.RowKey, StringComparer.Ordinal)
                                    .ToList ();
        ordered.Insert (Math.Clamp (newTaskOrder, 0, ordered.Count), taskToUpdate);

        for (var index = 0; index < ordered.Count; index ++)
        {
            var currentTaskToUpdate = ordered[index];
            if (currentTaskToUpdate.RowKey == taskToUpdate.RowKey || currentTaskToUpdate.TaskOrder == index)
                continue;

            var newTaskToUpdate = DeepCopier.Copy (currentTaskToUpdate);
            newTaskToUpdate.TaskOrder = index;

            // currentTaskToUpdate: the rollback has to hold the row as it stands,
            // not the copy carrying the new order.
            var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, newTaskToUpdate);
            arcTransaction.Add (transaction, currentTaskToUpdate);
        }

        return arcTransaction;
    }

    public ArcTransaction DecrementExistingTasksOrder (IEnumerable<Models.Board.Task> taskEnumerableToUpdate, ArcTransaction arcTransaction)
    {
        foreach (var task in taskEnumerableToUpdate)
        {
            task.TaskOrder  --;

            var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, task);
            arcTransaction.Add (transaction, task);
        }

        return arcTransaction;
    }
}