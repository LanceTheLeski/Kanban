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
        => ActiveTask.Order = int.Parse (taskOrder);

    private async Task<List<TaskTypeResponse>> FetchTaskTypesAsync ()
        => await _taskRepository.FetchTaskTypesAsync (new List<int> { 0 });

    private async System.Threading.Tasks.Task UpdateTaskAsync ()
    {
        var patchDocument = new JsonPatchDocument ();

        if (ActiveTask.Title != _initialTaskTitle)
            patchDocument.Add (nameof (TaskPatchRequest.Title), ActiveTask.Title);

        if (ActiveTask.TaskType?.ID != _taskTypeToAssign?.ID)
            patchDocument.Add (nameof (TaskPatchRequest.TypeID), _taskTypeToAssign.ID);

        if (ActiveTask.Order != _initialTaskOrder)
            patchDocument.Add (nameof (TaskPatchRequest.Order), ActiveTask.Order);

        if (ActiveTask.IsCompleted != _initialIsCompleted)
            patchDocument.Add (nameof (TaskPatchRequest.IsComplete), ActiveTask.IsCompleted);

        await _taskRepository.UpdateTaskAsync (BoardID, CardID.Value, ActiveTask.ID!.Value, patchDocument);

        Refresh.InvokeAsync (true);
    }
}