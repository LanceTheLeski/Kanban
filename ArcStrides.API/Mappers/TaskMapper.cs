using ArcStrides.API.Models.TagGroup;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.API.Mappers;

[Mapper]
public partial class TaskMapper
{
    public partial void MapFieldsFromSourceToTarget (Models.Board.Task sourse, Models.Board.Task target);

    /// <summary>
    /// <see cref="TaskCreateRequest"/> --> <see cref="Task"/>
    /// </summary>
    [MapProperty (nameof (TaskCreateRequest.Title), nameof (Models.Board.Task.Title))]
    [MapProperty (nameof (TaskCreateRequest.TaskTypeID), nameof (Models.Board.Task.TaskTypeID))]
    [MapProperty (nameof (TaskCreateRequest.Order), nameof (Models.Board.Task.TaskOrder))]
    [MapProperty (nameof (TaskCreateRequest.IsComplete), nameof (Models.Board.Task.IsComplete))]
    public partial Models.Board.Task MapTaskCreateRequestToTask (TaskCreateRequest taskCreateRequest);

    /// <summary>
    /// <see cref="TaskPatchRequest"/> --> <see cref="Task"/>
    /// </summary>
    [MapProperty (nameof (TaskPatchRequest.Title), nameof (Models.Board.Task.Title))]
    [MapProperty (nameof (TaskPatchRequest.TypeID), nameof (Models.Board.Task.TaskTypeID))]
    [MapProperty (nameof (TaskPatchRequest.Order), nameof (Models.Board.Task.TaskOrder))]
    [MapProperty (nameof (TaskPatchRequest.IsComplete), nameof (Models.Board.Task.IsComplete))]
    [MapProperty (nameof (TaskPatchRequest.TimelineID), nameof (Models.Board.Task.TimelineID))]
    public partial Models.Board.Task MapTaskPatchRequestToTask (TaskPatchRequest taskPatchRequest);

    /// <summary>
    /// <see cref="Task"/> --> <see cref="TaskPatchRequest"/>
    /// </summary>
    [MapProperty (nameof (Models.Board.Task.Title), nameof (TaskPatchRequest.Title))]
    [MapProperty (nameof (Models.Board.Task.TaskTypeID), nameof (TaskPatchRequest.TypeID))]
    [MapProperty (nameof (Models.Board.Task.TaskOrder), nameof (TaskPatchRequest.Order))]
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
    [MapProperty (nameof (Models.Board.Task.TaskOrder), nameof (TaskResponse.Order))]
    [MapProperty (nameof (Models.Board.Task.IsComplete), nameof (TaskResponse.IsComplete))]
    public partial TaskResponse MapTaskToTaskResponse (Models.Board.Task task);

    #region Task Type

    public partial void MapFieldsFromSourceToTarget (TaskType source, TaskType target);

    /// <summary>
    /// <see cref="TaskTypeCreateRequest"/> --> <see cref="TaskType"/>
    /// </summary>
    [MapProperty (nameof (TaskTypeCreateRequest.Title), nameof (TaskType.Title))]
    public partial TaskType MapTaskTypeCreateRequestToTaskType (TaskTypeCreateRequest taskTypeCreateRequest);

    /// <summary>
    /// <see cref="TaskType"/> --> <see cref="TaskTypePatchRequest"/>
    /// </summary>
    [MapProperty (nameof (TaskType.Title), nameof (TaskTypePatchRequest.Title))]
    public partial TaskTypePatchRequest MapTaskTypeToTaskTypePatchRequest (TaskType taskType);

    /// <summary>
    /// <see cref="TaskTypePatchRequest"/> --> <see cref="TaskType"/>
    /// </summary>
    [MapProperty (nameof (TaskTypePatchRequest.Title), nameof (TaskType.Title))]
    public partial TaskType MapTaskTypePatchRequestToTaskType (TaskTypePatchRequest taskTypePatchRequest);

    /// <summary>
    /// <see cref="TaskType"/> --> <see cref="TaskTypeResponse"/>
    /// </summary>
    [MapProperty (nameof (TaskType.PartitionKey), nameof (TaskTypeResponse.GroupTagID))]
    [MapProperty (nameof (TaskType.RowKey), nameof (TaskTypeResponse.ID))]
    [MapProperty (nameof (TaskType.Title), nameof (TaskTypeResponse.Title))]
    public partial TaskTypeResponse MapTaskTypeToTaskTypeResponse (TaskType taskType);

    #endregion Task Type
}