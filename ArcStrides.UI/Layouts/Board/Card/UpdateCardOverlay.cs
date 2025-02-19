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

    private async System.Threading.Tasks.Task DeleteCardAsync ()
    {
        await _cardRepository.DeleteCardAsync (ActiveCard!.Id);

        Refresh.InvokeAsync (true);

        CloseOverlay ();
    }

    private async System.Threading.Tasks.Task UpdateCardAsync ()
    {
        var patchRequest = FormPatchRequestFromOverlay ();

        await _cardRepository.UpdateCardPositionAsync (ActiveCard!.Id, patchRequest);

        //Update Page
        Refresh.InvokeAsync (true);

        CloseOverlay ();
    }

    private async System.Threading.Tasks.Task DeleteTaskAsync (Guid taskID)
    {
        await _taskRepository.DeleteTaskAsync (BoardID, ActiveCard.Id, taskID);

        ActiveCard.Tasks.RemoveAll (task => task.ID == taskID);
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

    private void Fire (bool changed)
    {
        if (ActiveCard is not null)
        {
            _cardTitle = ActiveCard.Title;
            _cardDescription = ActiveCard.Description;
        }
    }
}