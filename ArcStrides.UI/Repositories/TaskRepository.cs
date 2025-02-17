using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Services;
using Microsoft.AspNetCore.JsonPatch;
using Newtonsoft.Json;

namespace ArcStrides.UI.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly IArcStridesService<TaskResponse> _arcStridesTaskBackend;
    private readonly IArcStridesService<List<TaskTypeResponse>> _arcStridesTaskTypeBackend;

    public TaskRepository (IArcStridesService<TaskResponse> arcStridesTaskBackend,
                           IArcStridesService<List<TaskTypeResponse>> arcStridesTaskTypeBackend)
    {
        _arcStridesTaskBackend = arcStridesTaskBackend;
        _arcStridesTaskTypeBackend = arcStridesTaskTypeBackend;
    }

    public async Task<TaskResponse?> FetchTaskAsync (Guid boardID, Guid cardID)
        => await _arcStridesTaskBackend.FetchEntityAsync ($"arcstrides/boards/{boardID}/cards/{cardID}/tasks");

    public async Task<TaskResponse?> CreateTaskAsync (Guid boardID, Guid cardID, TaskCreateRequest taskCreateRequest)
        => await _arcStridesTaskBackend.CreateEntityAsync (@$"arcstrides/boards/{boardID}/cards/{cardID}/tasks", JsonConvert.SerializeObject (taskCreateRequest));

    public async Task<TaskResponse?> UpdateTaskAsync (Guid boardID, Guid cardID, Guid taskID, JsonPatchDocument taskPatchRequestDocument)
        => await _arcStridesTaskBackend.UpdateEntityAsync ($"arcstrides/boards/{boardID}/cards/{cardID}/tasks/{taskID}", JsonConvert.SerializeObject (taskPatchRequestDocument));

    public async Task DeleteTaskAsync (Guid boardID, Guid cardID, Guid taskID)
        => await _arcStridesTaskBackend.DeleteEntityAsync ($"arcstrides/boards/{boardID}/cards/{cardID}/tasks/{taskID}");

    #region Task Type

    public async Task<List<TaskTypeResponse>> FetchTaskTypeAsync (int taskTypeID)
        => await _arcStridesTaskTypeBackend.FetchEntityAsync ("arcstrides/tasks/types");

    #endregion Task Type
}