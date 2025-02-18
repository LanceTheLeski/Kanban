using ArcStrides.API.Models;
using ArcStrides.API.Models.TagGroup;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Repositories;

public interface ITaskRepository
{
    #region Task

    Task<Models.Board.Task?> GetTaskAsync (Guid boardID, Guid taskID);

    Task<Collection<Models.Board.Task>> GetTasksAsync (Guid boardID);

    Task<Collection<Models.Board.Task>> QueryTasksAsync (Expression<Func<Models.Board.Task, bool>> taskQueryExpression);

    Task AddTaskAsync (Models.Board.Task taskToCreate);

    Task UpdateTaskAsync (Models.Board.Task taskToUpdate);

    Func<Models.Board.Task, bool> BuildTaskQuery (IEnumerable<Guid> cardIDCollection);

    #endregion Task

    #region Task Type

    Task<TaskType?> GetTaskTypeAsync (Guid tagGroupID, int taskTypeID);

    Task<Collection<TaskType>> GetTaskTypesAsync (Guid tagGroupID);

    Task<Collection<TaskType>> QueryTaskTypesAsync (Expression<Func<TaskType, bool>> taskTypeQueryExpression);

    Task AddTaskTypeAsync (TaskType taskTypeToCreate);

    Task UpdateTaskTypeAsync (TaskType taskTypeToUpdate);

    #endregion Task Type

    Task<bool> SubmitArcTransactionAsync (ArcTransaction arcTransaction);

    ArcTransaction ApplyNewOrderForExistingTasks (Models.Board.Task taskToUpdate, int newTaskOrder, IEnumerable<Models.Board.Task> taskEnumerable, ArcTransaction arcTransaction);
}