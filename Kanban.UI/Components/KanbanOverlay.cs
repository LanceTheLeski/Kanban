namespace Kanban.UI.Components;

public partial class KanbanOverlay : IKanbanOverlay
{
    public void OpenOverlay ()
        => Open = true;

    private void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }
}