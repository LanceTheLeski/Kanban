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

    private async System.Threading.Tasks.Task DeleteCard ()
    {
        await _cardRepository.DeleteCardAsync (ActiveCard!.Id);

        Refresh.InvokeAsync (true);

        CloseOverlay ();
    }

    private async System.Threading.Tasks.Task UpdateCard ()
    {
        var patchRequest = FormPatchRequestFromOverlay ();

        await _cardRepository.UpdateCardPositionAsync (ActiveCard!.Id, patchRequest);

        //Update Page
        Refresh.InvokeAsync (true);

        CloseOverlay ();
    }

    private string FormPatchRequestFromOverlay ()
    {
        var patchRequestForTitle = string.IsNullOrEmpty (_cardTitle) ?
            "" :
            $@"{{ ""op"": ""replace"", ""path"": ""/Title"", ""value"": ""{_cardTitle}"" }},";
        var patchRequestForDescription = string.IsNullOrEmpty (_cardDescription) ?
            "" :
            $@"{{ ""op"": ""replace"", ""path"": ""/Description"", ""value"": ""{_cardDescription}"" }},";

        if (patchRequestForTitle is "" && patchRequestForDescription is "")
            return string.Empty;

        return
        $@"[
            {patchRequestForTitle}
            {patchRequestForDescription}
        ]";
    }
}