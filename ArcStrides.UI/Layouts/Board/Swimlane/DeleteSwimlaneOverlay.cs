using ArcStrides.UI.Components.ArcOverlay;

namespace ArcStrides.UI.Layouts.Board.Swimlane;

public partial class DeleteSwimlaneOverlay : IArcOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }

    private void SetSwimlaneNameToDelete (string swimlaneName)
    {
        var matchingSwimlaneNameCount = SwimlaneTitles.FindAll (swimlane => swimlane == swimlaneName).Count ();
        if (matchingSwimlaneNameCount is not 1)
        {
            throw new Exception ($"The swimlane selected does not correspond to a single swimlane in our list of columns. Number of this swimlane found: {matchingSwimlaneNameCount}");
        }
        //Replace with FluentValidation in the cs partial class. If it fails then use the Snackbar to display the error.

        _swimlaneTitleSelected = swimlaneName;
    }

    private async System.Threading.Tasks.Task RemoveSwimlaneAsync ()
    {
        var swimlaneToDeleteListIndex = SwimlaneTitles.IndexOf (_swimlaneTitleSelected); // Keep in mind that on a given board, swimlane names should be unique.
        var swimlaneToDeleteGuid = Swimlanes [swimlaneToDeleteListIndex];

        await _swimlaneRepository.DeleteSwimlaneAsync (BoardID, swimlaneToDeleteGuid);

        await RemoveFromPageAsync (swimlaneToDeleteListIndex);
        CloseOverlay ();
    }

    private async System.Threading.Tasks.Task RemoveFromPageAsync (int swimlaneToDeleteIndex)
    {
        Swimlanes.RemoveAt (swimlaneToDeleteIndex);
        await SwimlanesChanged.InvokeAsync (Swimlanes);

        SwimlaneTitles.RemoveAt (swimlaneToDeleteIndex);
        await SwimlaneTitlesChanged.InvokeAsync (SwimlaneTitles);

        Refresh.InvokeAsync (true);
    }
}