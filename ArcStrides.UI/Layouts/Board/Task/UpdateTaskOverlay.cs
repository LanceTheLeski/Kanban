using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using Microsoft.AspNetCore.JsonPatch;

namespace ArcStrides.UI.Layouts.Board.Task;

public partial class UpdateTaskOverlay
{
    private void SetTaskTypeOnTask (string taskTypeName)
    {
        var matchingTaskTypes = _taskTypes.FindAll (taskType => taskType.Title == taskTypeName);
        if (matchingTaskTypes.Count () is not 1)
        {
            // Should we throw exceptions? Or have the snackbar display exceptions?
            // I think that the UI should throw exceptions and the Blazor UI should maybe use something reliable like the snackbar.
            throw new Exception ($"The task type selected does not correspond to a single column in our list of columns. Number of this task type found: {matchingTaskTypes}");
        }

        _taskTypeToAssign = matchingTaskTypes.Single ();
    }

    private void SetTaskOrderOnTask (string taskOrder)
        => Task.Order = int.Parse (taskOrder);

    private async Task<List<TaskTypeResponse>> FetchTaskTypesAsync (int taskTypeID)
        => await _taskRepository.FetchTaskTypesAsync (new List<int> { 0 });

    private async System.Threading.Tasks.Task UpdateTaskAsync ()
    {
        var patchDocument = new JsonPatchDocument ();

        if (Task.Title != _initialTaskTitle)
            patchDocument.Add (nameof (TaskPatchRequest.Title), Task.Title);

        if (Task.TaskType?.ID != _taskTypeToAssign?.ID)
            patchDocument.Add (nameof (TaskPatchRequest.TypeID), _taskTypeToAssign.ID);

        if (Task.Order != _initialTaskOrder)
            patchDocument.Add (nameof (TaskPatchRequest.Order), Task.Order);

        if (Task.IsCompleted != _initialIsCompleted)
            patchDocument.Add (nameof (TaskPatchRequest.IsComplete), Task.IsCompleted);

        await _taskRepository.UpdateTaskAsync (BoardID, CardID.Value, Task.ID!.Value, patchDocument);

        Refresh.InvokeAsync (true);
    }
}