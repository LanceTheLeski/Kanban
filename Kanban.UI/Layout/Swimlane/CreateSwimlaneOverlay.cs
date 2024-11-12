using Kanban.UI.Components;

namespace Kanban.UI.Layout.Swimlane;

public partial class CreateSwimlaneOverlay : IKanbanOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }
}