using ArcStrides.UI.Components.ArcOverlay;

namespace ArcStrides.UI.Layout.Task;

public partial class UpdateTaskOverlay : IArcOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }
}