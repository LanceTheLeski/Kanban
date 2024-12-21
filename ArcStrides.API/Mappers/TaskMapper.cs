using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.API.Mappers;

[Mapper]
public partial class TaskMapper : ITaskMapper
{
    [MapProperty (nameof (TaskCreateRequest.CardID), nameof (Models.Task.RowKey))]
    [MapProperty (nameof (TaskCreateRequest.Title), nameof (Models.Task.Title))]
    [MapProperty (nameof (TaskCreateRequest.TaskTypeID), nameof (Models.Task.TaskTypeID))]
    public partial Models.Task MapTaskCreateRequestToTask (TaskCreateRequest taskCreateRequest);

    [MapProperty (nameof (TaskPatchRequest.Title), nameof (Models.Task.Title))]
    [MapProperty (nameof (TaskPatchRequest.TypeID), nameof (Models.Task.TaskTypeID))]
    [MapProperty (nameof (TaskPatchRequest.TaskOrder), nameof (Models.Task.TaskOrder))]
    [MapProperty (nameof (TaskPatchRequest.IsComplete), nameof (Models.Task.IsComplete))]
    [MapProperty (nameof (TaskPatchRequest.TimelineID), nameof (Models.Task.TimelineID))]
    public partial Models.Task MapTaskPatchRequestToPatch (TaskPatchRequest taskPatchRequest);

    [MapProperty (nameof (Models.Task.Title), nameof (TaskPatchRequest.Title))]
    [MapProperty (nameof (Models.Task.TaskTypeID), nameof (TaskPatchRequest.TypeID))]
    [MapProperty (nameof (Models.Task.TaskOrder), nameof (TaskPatchRequest.TaskOrder))]
    [MapProperty (nameof (Models.Task.IsComplete), nameof (TaskPatchRequest.IsComplete))]
    [MapProperty (nameof (Models.Task.TimelineID), nameof (TaskPatchRequest.TimelineID))]
    public partial TaskPatchRequest MapTaskToTaskPatchRequest (Models.Task task);

    [MapProperty (nameof (Models.Task.Title), nameof (TaskResponse.Title))]
    [MapProperty (nameof (Models.Task.TaskTypeID), nameof (TaskResponse.TaskTypeID))]
    //[MapProperty (nameof (Models.Task.TaskTypeTitle), nameof (TaskResponse.TaskTypeTitle))]
    [MapProperty (nameof (Models.Task.IsComplete), nameof (TaskResponse.isCompleted))]
    public partial TaskResponse MapTaskToTaskResponse (Models.Task task);
}