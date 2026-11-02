using ArcStrides.UI.Components.ArcOverlay;

namespace ArcStrides.UI.Layouts.Board;

public partial class AddManageBoardOverlay : IArcOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }
}