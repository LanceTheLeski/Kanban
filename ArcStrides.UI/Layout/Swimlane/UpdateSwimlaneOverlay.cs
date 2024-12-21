using ArcStrides.UI.Components.ArcOverlay;

namespace ArcStrides.UI.Layout.Swimlane;

public partial class UpdateSwimlaneOverlay : IArcOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }
}