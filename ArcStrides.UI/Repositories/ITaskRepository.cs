using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;

namespace ArcStrides.UI.Repositories;

public interface ITaskRepository
{
    Task<TaskResponse?> FetchTaskAsync (Guid boardID, Guid cardID);

    Task<TaskResponse?> CreateTaskAsync (Guid boardID, Guid cardID, TaskCreateRequest taskCreateRequest);

    Task<TaskResponse?> UpdateTask (Guid boardID, Guid cardID, Guid taskID, string taskPatchRequest);

    Task DeleteTask (Guid boardID, Guid cardID, Guid taskID);

    #region Task Type

    Task<List<TaskTypeResponse?>> FetchTaskTypeAsync (int taskTypeID);

    #endregion Task Type
}