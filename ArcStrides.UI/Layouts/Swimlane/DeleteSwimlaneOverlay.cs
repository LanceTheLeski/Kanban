using ArcStrides.UI.Components.ArcOverlay;

namespace ArcStrides.UI.Layouts.Swimlane;

public partial class DeleteSwimlaneOverlay : IArcOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }
}