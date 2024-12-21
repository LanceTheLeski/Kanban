using ArcStrides.UI.Components.ArcOverlay;

namespace ArcStrides.UI.Layout.Column;

public partial class CreateColumnOverlay : IArcOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }
}