using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Services;
using Microsoft.AspNetCore.JsonPatch;
using Newtonsoft.Json;

namespace ArcStrides.UI.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly IArcStridesService<TaskResponse> _arcStridesTaskBackend;
    private readonly IArcStridesService<TaskTypeResponse> _arcStridesTaskTypeBackend;

    public TaskRepository (IArcStridesService<TaskResponse> arcStridesTaskBackend,
                           IArcStridesService<TaskTypeResponse> arcStridesTaskTypeBackend)
    {
        _arcStridesTaskBackend = arcStridesTaskBackend;
        _arcStridesTaskTypeBackend = arcStridesTaskTypeBackend;
    }

    public async Task<TaskResponse?> FetchTaskAsync (Guid boardID, Guid cardID)
        => await _arcStridesTaskBackend.FetchEntityAsync ($"arcstrides/boards/{boardID}/cards/{cardID}/tasks");

    public async Task<TaskResponse?> CreateTaskAsync (Guid boardID, Guid cardID, TaskCreateRequest taskCreateRequest)
        => await _arcStridesTaskBackend.CreateEntityAsync ($"arcstrides/boards/{boardID}/cards/{cardID}/tasks", JsonConvert.SerializeObject (taskCreateRequest));

    public async Task<TaskResponse?> UpdateTaskAsync (Guid boardID, Guid cardID, Guid taskID, JsonPatchDocument taskPatchRequestDocument)
        => await _arcStridesTaskBackend.UpdateEntityAsync ($"arcstrides/boards/{boardID}/cards/{cardID}/tasks/{taskID}", JsonConvert.SerializeObject (taskPatchRequestDocument));

    public async Task DeleteTaskAsync (Guid boardID, Guid cardID, Guid taskID)
        => await _arcStridesTaskBackend.DeleteEntityAsync ($"arcstrides/boards/{boardID}/cards/{cardID}/tasks/{taskID}");

    #region Task Type

    public async Task<TaskTypeResponse?> FetchTaskTypeAsync (Guid tagGroupID, int taskTypeID)
        => await _arcStridesTaskTypeBackend.FetchEntityAsync ($"arcstrides/taggroups/{tagGroupID}/tasks/types?TaskTypeIDs={taskTypeID}");

    public async Task<List<TaskTypeResponse>> FetchTaskTypesAsync (IEnumerable<int> taskTypeIDs)
        => await _arcStridesTaskTypeBackend.FetchEntitiesAsync ($"arcstrides/tasks/types?TaskTypeIDs={string.Join (',', taskTypeIDs)}");

    public async Task<TaskTypeResponse?> CreateTaskTypeAsync (Guid tagGroupID, TaskTypeCreateRequest taskTypeCreateRequest)
        => await _arcStridesTaskTypeBackend.CreateEntityAsync ($"arcstrides/taggroups/{tagGroupID}/tasks/types", JsonConvert.SerializeObject (taskTypeCreateRequest));

    public async Task<TaskTypeResponse?> UpdateTaskTypeAsync (Guid tagGroupID, int taskTypeID, TaskTypePatchRequest taskTypePatchRequest)
        => await _arcStridesTaskTypeBackend.UpdateEntityAsync ($"arcstrides/taggroups/{tagGroupID}/tasks/types/{taskTypeID}", JsonConvert.SerializeObject (taskTypePatchRequest));


    #endregion Task Type
}