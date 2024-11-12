using Kanban.UI.Components;

namespace Kanban.UI.Layout.Column;

public partial class UpdateColumnOverlay: IKanbanOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }
}