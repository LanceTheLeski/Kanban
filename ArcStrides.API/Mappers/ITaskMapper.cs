using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;

namespace ArcStrides.API.Mappers;

public interface ITaskMapper
{
    Models.Board.Task MapTaskCreateRequestToTask (TaskCreateRequest taskCreateRequest);

    Models.Board.Task MapTaskPatchRequestToPatch (TaskPatchRequest taskPatchRequest);

    TaskPatchRequest MapTaskToTaskPatchRequest (Models.Board.Task task);

    TaskResponse MapTaskToTaskResponse (Models.Board.Task task);
}