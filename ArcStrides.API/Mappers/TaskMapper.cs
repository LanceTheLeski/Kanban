using ArcStrides.API.Models.TagGroup;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.API.Mappers;

[Mapper]
public partial class TaskMapper
{
    /// <summary>
    /// <see cref="TaskCreateRequest"/> --> <see cref="Task"/>
    /// </summary>
    [MapProperty (nameof (TaskCreateRequest.Title), nameof (Models.Board.Task.Title))]
    [MapProperty (nameof (TaskCreateRequest.CardID), nameof (Models.Board.Task.CardID))]
    [MapProperty (nameof (TaskCreateRequest.TaskTypeID), nameof (Models.Board.Task.TaskTypeID))]
    public partial Models.Board.Task MapTaskCreateRequestToTask (TaskCreateRequest taskCreateRequest);

    /// <summary>
    /// <see cref="TaskPatchRequest"/> --> <see cref="Task"/>
    /// </summary>
    [MapProperty (nameof (TaskPatchRequest.Title), nameof (Models.Board.Task.Title))]
    [MapProperty (nameof (TaskPatchRequest.TypeID), nameof (Models.Board.Task.TaskTypeID))]
    [MapProperty (nameof (TaskPatchRequest.TaskOrder), nameof (Models.Board.Task.TaskOrder))]
    [MapProperty (nameof (TaskPatchRequest.IsComplete), nameof (Models.Board.Task.IsComplete))]
    [MapProperty (nameof (TaskPatchRequest.TimelineID), nameof (Models.Board.Task.TimelineID))]
    public partial Models.Board.Task MapTaskPatchRequestToPatch (TaskPatchRequest taskPatchRequest);

    /// <summary>
    /// <see cref="Task"/> --> <see cref="TaskPatchRequest"/>
    /// </summary>
    [MapProperty (nameof (Models.Board.Task.Title), nameof (TaskPatchRequest.Title))]
    [MapProperty (nameof (Models.Board.Task.TaskTypeID), nameof (TaskPatchRequest.TypeID))]
    [MapProperty (nameof (Models.Board.Task.TaskOrder), nameof (TaskPatchRequest.TaskOrder))]
    [MapProperty (nameof (Models.Board.Task.IsComplete), nameof (TaskPatchRequest.IsComplete))]
    [MapProperty (nameof (Models.Board.Task.TimelineID), nameof (TaskPatchRequest.TimelineID))]
    public partial TaskPatchRequest MapTaskToTaskPatchRequest (Models.Board.Task task);

    /// <summary>
    /// <see cref="Task"/> --> <see cref="TaskResponse"/>
    /// </summary>
    [MapProperty (nameof (Models.Board.Task.PartitionKey), nameof (TaskResponse.BoardID))]
    [MapProperty (nameof (Models.Board.Task.RowKey), nameof (TaskResponse.ID))]
    [MapProperty (nameof (Models.Board.Task.Title), nameof (TaskResponse.Title))]
    [MapProperty (nameof (Models.Board.Task.TaskTypeID), nameof (TaskResponse.TaskTypeID))]
    [MapProperty (nameof (Models.Board.Task.IsComplete), nameof (TaskResponse.isCompleted))]
    public partial TaskResponse MapTaskToTaskResponse (Models.Board.Task task);

    #region Task Type

    [MapProperty (nameof (TaskType.PartitionKey), nameof (TaskTypeResponse.GroupTagID))]
    [MapProperty (nameof (TaskType.RowKey), nameof (TaskTypeResponse.ID))]
    [MapProperty (nameof (TaskType.Title), nameof (TaskTypeResponse.Title))]
    public partial TaskTypeResponse MapTaskToTaskTypeResponse (TaskType taskType);

    #endregion Task Type
}