using Kanban.UI.Components;

namespace Kanban.UI.Layout.Column;

public partial class DeleteColumnOverlay : IKanbanOverlay
{
    public void OpenOverlay ()
        => Open = true;
}