using ArcStrides.UI.Components.ArcOverlay;

namespace ArcStrides.UI.Layouts.Board.Column;

public partial class UpdateColumnOverlay: IArcOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }
}