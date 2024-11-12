using Kanban.UI.Components;

namespace Kanban.UI.Layout.Column;

public partial class CreateColumnOverlay : IKanbanOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }
}