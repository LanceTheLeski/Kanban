using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;

namespace ArcStrides.UI.Layouts.Board.Task;

public partial class CreateTaskOverlay
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

    private async System.Threading.Tasks.Task CreateTaskAsync ()
    {
        var createRequest = new TaskCreateRequest
        {
            Title = TaskTitle,
            TaskTypeID = taskTypeToAssign?.ID ?? -1,
            Order = TaskOrder,
            IsComplete = IsComplete
            //Get timeline stuff here
        };

        await _taskRepository.CreateTaskAsync (BoardID, CardID.Value, createRequest);

        Refresh.InvokeAsync (true);
    }
}