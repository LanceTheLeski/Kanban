using Kanban.Contracts.Request.Create;
using Kanban.Contracts.Request.Patch;
using Kanban.Contracts.Response;

namespace Kanban.API.Mappers;

public interface ITaskMapper
{
    Models.Task MapTaskCreateRequestToTask (TaskCreateRequest taskCreateRequest);

    Models.Task MapTaskPatchRequestToPatch (TaskPatchRequest taskPatchRequest);

    TaskResponse MapTaskToTaskResponse (Models.Task task);
}