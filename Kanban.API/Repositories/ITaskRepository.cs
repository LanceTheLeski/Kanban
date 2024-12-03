using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public interface ITaskRepository
{
    Task<Models.Task?> GetTaskAsync (Guid taskID, Guid tagGroupID);

    Task<Azure.Response> AddTaskAsync (Models.Task taskToCreate);

    Task<Azure.Response> UpdateTaskAsync (Models.Task taskToUpdate);

    Func<Models.Task, bool> BuildTaskQuery (IEnumerable<Guid> cardIDCollection);

    Task<Collection<Models.Task>> QueryTasksAsync (Expression<Func<Models.Task, bool>> taskQueryExpression);
}