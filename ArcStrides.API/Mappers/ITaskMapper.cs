using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;

namespace ArcStrides.API.Mappers;

public interface ITaskMapper
{
    Models.Task MapTaskCreateRequestToTask (TaskCreateRequest taskCreateRequest);

    Models.Task MapTaskPatchRequestToPatch (TaskPatchRequest taskPatchRequest);

    TaskPatchRequest MapTaskToTaskPatchRequest (Models.Task task);

    TaskResponse MapTaskToTaskResponse (Models.Task task);
}