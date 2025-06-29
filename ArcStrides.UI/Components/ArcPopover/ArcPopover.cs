namespace ArcStrides.UI.Components.ArcPopover;

public partial class ArcPopover
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }
}