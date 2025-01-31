using ArcStrides.UI.Components.ArcOverlay;

namespace ArcStrides.UI.Layouts.Board.Swimlane;

public partial class UpdateSwimlaneOverlay : IArcOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }

    private void GetSwimlaneIndexList ()
    {
        _swimlaneTitleList = Enumerable.Range (0, SwimlaneTitles.Count ())
                                       .Select (index => $"{index}")
                                       .ToList ();
    }

    private void SetSwimlaneNameToUpdate (string swimlaneName)
    {
        var matchingSwimlaneNameCount = SwimlaneTitles.FindAll (swimlane => swimlane == swimlaneName).Count ();
        if (matchingSwimlaneNameCount is not 1)
        {
            // Should we throw exceptions? Or have the snackbar display exceptions?
            // I think that the API should throw exceptions and the Blazor UI should maybe use something reliable like the snackbar.
            throw new Exception ($"The swimlane selected does not correspond to a single swimlane in our list of swimlanes. Number of this swimlane found: {matchingSwimlaneNameCount}");
        }

        _swimlaneTitleSelected = swimlaneName;
        _swimlaneTitleReplacement = swimlaneName;
    }

    private async System.Threading.Tasks.Task UpdateSwimlane ()
    {
        var swimlaneToUpdateListIndex = SwimlaneTitles.IndexOf (_swimlaneTitleSelected); // Keep in mind that on a given board, swimlane names should be unique.
        var swimlaneToUpdateGuid = Swimlanes [swimlaneToUpdateListIndex];

        var patchRequest = FormPatchRequestFromOverlay ();

        var response = await _swimlaneRepository.UpdateSwimlaneAsync (BoardID, swimlaneToUpdateGuid, patchRequest);

        await UpdateOnPageAsync (swimlaneToUpdateListIndex);
        CloseOverlay ();
    }

    private string FormPatchRequestFromOverlay ()
    {
        var patchRequestForTitle = string.IsNullOrWhiteSpace (_swimlaneTitleReplacement) ?
                                        "" :
                                        $@"{{ ""op"": ""replace"", ""path"": ""/Title"", ""value"": ""{_swimlaneTitleReplacement}"" }},";
        var patchRequestForOrder = _swimlaneOrderSelected is -1 ?
                                        "" :
                                        $@"{{ ""op"": ""replace"", ""path"": ""/Order"", ""value"": ""{_swimlaneOrderSelected}"" }}";

        if (patchRequestForTitle is "" && patchRequestForOrder is "")
            return string.Empty;

        return
        $@"[
            {patchRequestForTitle}
            {patchRequestForOrder}
        ]";
    }

    private async System.Threading.Tasks.Task UpdateOnPageAsync (int swimlaneToUpdateIndex)
    {
        Swimlanes.RemoveAt (swimlaneToUpdateIndex); // This is not actually what we want
        await SwimlanesChanged.InvokeAsync (Swimlanes);

        SwimlaneTitles.RemoveAt (swimlaneToUpdateIndex); // This is not actually what we want
        await SwimlaneTitlesChanged.InvokeAsync (SwimlaneTitles);

        Refresh.InvokeAsync (true);
    }
}