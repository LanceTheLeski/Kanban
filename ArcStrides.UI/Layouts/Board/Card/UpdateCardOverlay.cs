using ArcStrides.UI.Components.ArcOverlay;

namespace ArcStrides.UI.Layouts.Board.Card;

public partial class UpdateCardOverlay : IArcOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }
}