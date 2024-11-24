using Kanban.API.Components;
using Kanban.API.Models;
using Kanban.API.Options;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public class TaskTypeRepository : EntityRepository<TaskType>, ITaskTypeRepository
{
    private const string taskTypes = "TaskTypes";

    public TaskTypeRepository (IOptions<CosmosOptions> cosmosOptions)
        : base (taskTypes, cosmosOptions)
    { }

    public async Task<TaskType?> GetTaskTypeAsync (Guid taskTypeID, Guid tagGroupID)
        => await GetEntityAsync (taskTypeID, tagGroupID);

    public async Task<Collection<TaskType>> QueryTaskTypesAsync (Expression<Func<TaskType, bool>> taskTypeQueryExpression)
        => await QueryEntitiesAsync (taskTypeQueryExpression);
}