using ArcStrides.Contracts.Response;
using ArcStrides.UI.Models.Board;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.UI.Mappers;

[Mapper]
public partial class TaskMapper
{
    [MapProperty (nameof (TaskResponse.ID), nameof (Models.Board.Task.ID))]
    [MapProperty (nameof (TaskResponse.Title), nameof (Models.Board.Task.Title))]
    [MapProperty (nameof (TaskResponse.TaskType), nameof (Models.Board.Task.TaskType))]
    [MapProperty (nameof (TaskResponse.Order), nameof (Models.Board.Task.Order))]
    [MapProperty (nameof (TaskResponse.IsComplete), nameof (Models.Board.Task.IsCompleted))]
    public partial Models.Board.Task MapTaskResponsetoTask (TaskResponse taskResponse);

    #region Task Type

    [MapProperty (nameof (TaskTypeResponse.ID), nameof (TaskType.ID))]
    [MapProperty (nameof (TaskTypeResponse.GroupTagID), nameof (TaskType.GroupTagID))]
    [MapProperty (nameof (TaskTypeResponse.Title), nameof (TaskType.Title))]
    public partial TaskType MapTaskTypeResponseToTaskType (TaskTypeResponse taskTypeResponse);

    #endregion Task Type
}