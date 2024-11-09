namespace Kanban.UI.Components;

public partial class KanbanOverlay
{
    private void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }
}