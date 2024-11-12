using Kanban.UI.Components;

namespace Kanban.UI.Layout.Card;

public partial class UpdateCardOverlay : IKanbanOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }
}