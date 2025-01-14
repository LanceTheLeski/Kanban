using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.API.Mappers;

[Mapper]
public partial class TaskMapper : ITaskMapper
{
    [MapProperty (nameof (TaskCreateRequest.Title), nameof (Models.Board.Task.Title))]
    [MapProperty (nameof (TaskCreateRequest.TaskTypeID), nameof (Models.Board.Task.TaskTypeID))]
    public partial Models.Board.Task MapTaskCreateRequestToTask (TaskCreateRequest taskCreateRequest);

    [MapProperty (nameof (TaskPatchRequest.Title), nameof (Models.Board.Task.Title))]
    [MapProperty (nameof (TaskPatchRequest.TypeID), nameof (Models.Board.Task.TaskTypeID))]
    [MapProperty (nameof (TaskPatchRequest.TaskOrder), nameof (Models.Board.Task.TaskOrder))]
    [MapProperty (nameof (TaskPatchRequest.IsComplete), nameof (Models.Board.Task.IsComplete))]
    [MapProperty (nameof (TaskPatchRequest.TimelineID), nameof (Models.Board.Task.TimelineID))]
    public partial Models.Board.Task MapTaskPatchRequestToPatch (TaskPatchRequest taskPatchRequest);

    [MapProperty (nameof (Models.Board.Task.Title), nameof (TaskPatchRequest.Title))]
    [MapProperty (nameof (Models.Board.Task.TaskTypeID), nameof (TaskPatchRequest.TypeID))]
    [MapProperty (nameof (Models.Board.Task.TaskOrder), nameof (TaskPatchRequest.TaskOrder))]
    [MapProperty (nameof (Models.Board.Task.IsComplete), nameof (TaskPatchRequest.IsComplete))]
    [MapProperty (nameof (Models.Board.Task.TimelineID), nameof (TaskPatchRequest.TimelineID))]
    public partial TaskPatchRequest MapTaskToTaskPatchRequest (Models.Board.Task task);

    [MapProperty (nameof (Models.Board.Task.Title), nameof (TaskResponse.Title))]
    [MapProperty (nameof (Models.Board.Task.TaskTypeID), nameof (TaskResponse.TaskTypeID))]
    //[MapProperty (nameof (Models.Task.TaskTypeTitle), nameof (TaskResponse.TaskTypeTitle))]
    [MapProperty (nameof (Models.Board.Task.IsComplete), nameof (TaskResponse.isCompleted))]
    public partial TaskResponse MapTaskToTaskResponse (Models.Board.Task task);
}