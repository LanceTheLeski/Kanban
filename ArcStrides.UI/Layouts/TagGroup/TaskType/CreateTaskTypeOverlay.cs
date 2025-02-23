using ArcStrides.Contracts.Request.Create;
using ArcStrides.UI.Components.ArcOverlay;

namespace ArcStrides.UI.Layouts.TagGroup.TaskType;

public partial class CreateTaskTypeOverlay : IArcOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }

    public async Task CreateTaskTypeAsync ()
    {
        var createRequest = new TaskTypeCreateRequest
        {
            Title = TaskType.Title
        };

        var taskTypeResponse = await _taskRepository.CreateTaskTypeAsync (TaskType.GroupTagID!.Value, createRequest);

        //Do validation here..

        Refresh.InvokeAsync (true);
    }
}