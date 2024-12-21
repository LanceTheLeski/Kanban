using ArcStrides.API.Models;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Repositories;

public interface ITaskRepository
{
    #region Task

    Task<Models.Task?> GetTaskAsync (Guid timelineID, Guid tagGroupID);

    Task<Collection<Models.Task>> GetTasksAsync (Guid taskID);

    Task<Collection<Models.Task>> QueryTasksAsync (Expression<Func<Models.Task, bool>> taskQueryExpression);

    Task AddTaskAsync (Models.Task taskToCreate);

    Task UpdateTaskAsync (Models.Task taskToUpdate);

    Func<Models.Task, bool> BuildTaskQuery (IEnumerable<Guid> cardIDCollection);

    #endregion Task

    #region Task Type

    Task<TaskType?> GetTaskTypeAsync (int taskTypeID, Guid tagGroupID);

    Task<Collection<TaskType>> GetTaskTypesAsync (int taskTypeID);

    Task<Collection<TaskType>> QueryTaskTypesAsync (Expression<Func<TaskType, bool>> taskTypeQueryExpression);

    #endregion Task Type
}