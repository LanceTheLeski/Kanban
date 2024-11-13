using Kanban.UI.Components;

namespace Kanban.UI.Layout.Task;

public partial class UpdateTaskOverlay : IKanbanOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }
}