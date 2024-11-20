using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public interface ITaskRepository
{
    public Task<Models.Task?> GetTaskAsync (Guid taskID, Guid tagGroupID);

    public Task<Azure.Response> UpdateTaskAsync (Models.Task taskToUpdate);

    public Task<Collection<Models.Task>> QueryTasksAsync (Expression<Func<Models.Task, bool>> taskQueryExpression);

    public Task<Azure.Response> AddTaskAsync (Models.Task taskToCreate);
}