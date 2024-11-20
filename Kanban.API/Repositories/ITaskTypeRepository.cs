using Kanban.API.Models;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public interface ITaskTypeRepository
{
    public Task<TaskType?> GetTaskTypeAsync (Guid taskTypeID, Guid tagGroupID);

    public Task<Collection<TaskType>> QueryTaskTypesAsync (Expression<Func<TaskType, bool>> taskTypeQueryExpression);
}