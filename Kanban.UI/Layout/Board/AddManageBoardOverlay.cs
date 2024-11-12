using Kanban.UI.Components;

namespace Kanban.UI.Layout.Board;

public partial class AddManageBoardOverlay : IKanbanOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }
}