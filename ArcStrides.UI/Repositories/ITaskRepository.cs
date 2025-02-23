using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using Microsoft.AspNetCore.JsonPatch;

namespace ArcStrides.UI.Repositories;

public interface ITaskRepository
{
    Task<TaskResponse?> FetchTaskAsync (Guid boardID, Guid cardID);

    Task<TaskResponse?> CreateTaskAsync (Guid boardID, Guid cardID, TaskCreateRequest taskCreateRequest);

    Task<TaskResponse?> UpdateTaskAsync (Guid boardID, Guid cardID, Guid taskID, JsonPatchDocument taskPatchRequestDocument);

    Task DeleteTaskAsync (Guid boardID, Guid cardID, Guid taskID);

    #region Task Type

    Task<TaskTypeResponse?> FetchTaskTypeAsync (Guid tagGroupID, int taskTypeID);

    Task<List<TaskTypeResponse>> FetchTaskTypesAsync (IEnumerable<int> taskTypeIDs);

    Task<TaskTypeResponse?> CreateTaskTypeAsync (Guid tagGroupID, TaskTypeCreateRequest taskTypeCreateRequest);

    #endregion Task Type
}