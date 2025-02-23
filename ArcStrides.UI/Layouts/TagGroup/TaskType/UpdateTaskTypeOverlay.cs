using ArcStrides.Contracts.Request.Create;
using ArcStrides.UI.Components.ArcOverlay;

namespace ArcStrides.UI.Layouts.TagGroup.TaskType;

public partial class UpdateTaskTypeOverlay : IArcOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }

    public async Task UpdateTaskTypeAsync ()
    {
        var updateRequest = new TaskTypeCreateRequest
        {
            Title = TaskType.Title
        };

        var taskTypeResponse = await _taskRepository.CreateTaskTypeAsync (TaskType.GroupTagID!.Value, updateRequest);

        //Do validation here..

        Refresh.InvokeAsync (true);
    }
}