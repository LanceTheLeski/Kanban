using Kanban.UI.Components;

namespace Kanban.UI.Layout.Swimlane;

public partial class UpdateSwimlaneOverlay : IKanbanOverlay
{
    public void OpenOverlay ()
        => Open = true;
}