using Kanban.UI.Components;

namespace Kanban.UI.Layout.Board;

public partial class AddManageBoardOverlay : IKanbanOverlay
{
    public void OpenOverlay ()
        => Open = true;
}