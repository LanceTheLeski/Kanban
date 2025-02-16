using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;

namespace ArcStrides.UI.Layouts.Board.Task;

public partial class CreateTaskOverlay
{
    /*private async System.Threading.Tasks.Task TaskTypeListExpandedChanged (bool isTimeline)
    {
        if (isTimeline)
        {
            _taskTypeList = _taskTypeListRenderFragment ();
        }
        else
        {
            // Reset after a while to prevent sudden collapse.
            System.Threading.Tasks.Task.Delay (350).ContinueWith (t => _taskTypeList = null);
        }
    }*/

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

    /*private void TimelineFragmentChanged (bool isTimeline)
    {
        if (isTimeline)
        {
            _timelineFragment = _timelineRenderFragment ();
        }
        else
        {
            _timelineFragment = _deadlineRenderFragment ();
        }
    }*/

    private async Task<List<TaskTypeResponse?>> FetchTaskTypesAsync ()
        => await _taskRepository.FetchTaskTypeAsync (0/*placeholder arg*/);

    private async System.Threading.Tasks.Task CreateTaskAsync ()
    {
        var createRequest = new TaskCreateRequest
        {
            Title = TaskTitle,
            TaskTypeID = 0,//Replace later..
            //CardID = Guid.Empty//Replace later..
            
            // More to fill in..
        };

        await _taskRepository.CreateTaskAsync (BoardID, CardID.Value, createRequest);

        Refresh.InvokeAsync (true);
    }
}