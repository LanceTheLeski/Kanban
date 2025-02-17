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

        taskTypeToAssign = matchingTaskTypes.Single ();
    }

    private void SetTaskOrderOnTask (string taskOrder)
        => TaskOrder = int.Parse (taskOrder);

    private async Task<List<TaskTypeResponse?>> FetchTaskTypesAsync ()
        => await _taskRepository.FetchTaskTypeAsync (0/*placeholder arg*/);

    private async System.Threading.Tasks.Task UpdateTaskAsync ()
    {
        var patchDocument = new JsonPatchDocument ();

        if (TaskTitle != _initialTaskTitle)
            patchDocument.Add (nameof (TaskPatchRequest.Title), TaskTitle);

        if (TaskType.ID != taskTypeToAssign.ID)
            patchDocument.Add (nameof (TaskPatchRequest.TypeID), taskTypeToAssign.ID);

        if (TaskOrder != _initialTaskOrder)
            patchDocument.Add (nameof (TaskPatchRequest.TaskOrder), TaskOrder);

        if (IsComplete != _initialIsComplete.Value)
            patchDocument.Add (nameof (TaskPatchRequest.IsComplete), IsComplete);

        await _taskRepository.UpdateTaskAsync (BoardID, CardID.Value, TaskID, patchDocument);

        Refresh.InvokeAsync (true);
    }
}