using ArcStrides.Contracts.Response;
using ArcStrides.UI.Models;
using MudBlazor;

namespace ArcStrides.UI.Pages;

public partial class Board
{
    protected override async Task OnInitializedAsync ()
    {
        var boardResponse = await _boardService.FetchBoard (Guid.Parse ("20a88077-10d4-4648-92cb-7dc7ba5b8df5"));//Change later to be dynamic..
        _cards = ConvertBoardResponseToDropCardList (boardResponse);
    }

    public void OpenEditCardOverlay ()
    {
        editCardOverlayIsOpen = true;
    }
    public void UpdateEditCardOverlay (bool setEditCardOverlayIsOpen)
    {
        editCardOverlayIsOpen = setEditCardOverlayIsOpen;
    }

    public async Task Refresh (bool stateHasChanged)
    {
        if (stateHasChanged)
        {
            await OnInitializedAsync ();
            _dropContainer.Items = _cards;
            _dropContainer.Refresh ();
        }
    }

    public void UpdateCard (MudItemDropInfo<DropCard> cardToUpdate)
    {
        cardToUpdate.Item.CardArea = cardToUpdate.DropzoneIdentifier;

        var newCardArea = ConvertCardAreaToColumnAndSwimlane (cardToUpdate.Item.CardArea);
        cardToUpdate.Item.ColumnID = _columns [newCardArea.columnPos];
        cardToUpdate.Item.ColumnName = _columnTitles [newCardArea.columnPos];
        cardToUpdate.Item.ColumnNumber = newCardArea.columnPos;
        cardToUpdate.Item.SwimlaneID = _swimlanes [newCardArea.swimlanePos];
        cardToUpdate.Item.SwimlaneName = _swimlaneTitles [newCardArea.swimlanePos];
        cardToUpdate.Item.SwimlaneNumber = newCardArea.swimlanePos;

        var cardResponse = Task.Run (() =>
            SendCardPatchRequest (cardToUpdate.Item)).Result;
    }

    private async Task<BoardCardResponse?> SendCardPatchRequest (DropCard cardToUpdate)
    {
        var patchRequest =
        $@"[
            {{ ""op"": ""replace"", ""path"": ""/ColumnID"", ""value"": ""{cardToUpdate.ColumnID}"" }},
            {{ ""op"": ""replace"", ""path"": ""/ColumnTitle"", ""value"": ""{cardToUpdate.ColumnName}"" }},
            {{ ""op"": ""replace"", ""path"": ""/ColumnOrder"", ""value"": ""{cardToUpdate.ColumnNumber}"" }},
            {{ ""op"": ""replace"", ""path"": ""/SwimlaneID"", ""value"": ""{cardToUpdate.SwimlaneID}"" }},
            {{ ""op"": ""replace"", ""path"": ""/SwimlaneTitle"", ""value"": ""{cardToUpdate.SwimlaneName}"" }},
            {{ ""op"": ""replace"", ""path"": ""/SwimlaneOrder"", ""value"": ""{cardToUpdate.SwimlaneNumber}"" }}
        ]";

        return await _cardService.UpdateCard (Guid.Parse (cardToUpdate.Id), patchRequest);
    }

    private (int swimlanePos, int columnPos) ConvertCardAreaToColumnAndSwimlane (string cardAreaValue)
    {
        var swimlanePos_columnPos = cardAreaValue.Split ("_");
        var swimlanePos = int.Parse (swimlanePos_columnPos.First ());
        var columnPos = int.Parse (swimlanePos_columnPos.Last ());

        return (swimlanePos, columnPos);
    }

    private string ConvertColumnAndSwimlaneToCardArea (int swimlanePos, int columnPos)
    {
        return (swimlanePos + "_" + columnPos);
    }

    private List<DropCard> ConvertBoardResponseToDropCardList (BoardResponse boardResponse)
    {
        var dropCardList = new List<DropCard> ();

        _columnTitles = new List<string> ();
        _columns = new List<Guid> ();
        _swimlaneTitles = new List<string> ();
        _swimlanes = new List<Guid> ();

        var columnList = boardResponse.Columns;
        for (int columnIndex = 0; columnIndex < columnList.Count; columnIndex++)
        {
            var swimlaneList = columnList [columnIndex].Swimlanes;

            for (int swimlaneIndex = 0; swimlaneIndex < swimlaneList.Count; swimlaneIndex++)
            {
                var cardList = swimlaneList [swimlaneIndex].Cards;

                var cardArea = ConvertColumnAndSwimlaneToCardArea (swimlaneList [swimlaneIndex].Order, columnList [columnIndex].Order);
                foreach (var card in cardList)
                {
                    dropCardList.Add (new DropCard
                    {
                        Id = card.ID,
                        Title = card.Title,
                        Description = card.Description,
                        ColumnNumber = columnIndex,
                        ColumnID = Guid.Parse (columnList [columnIndex].ID),
                        ColumnName = columnList [columnIndex].Title,
                        SwimlaneNumber = swimlaneIndex,
                        SwimlaneID = Guid.Parse (swimlaneList [swimlaneIndex].ID),
                        SwimlaneName = swimlaneList [swimlaneIndex].Title,
                        //Tasks = card.Tasks,
                        CardArea = cardArea
                    });
                }
            }

            _columnTitles.Add (columnList [columnIndex].Title);
            _columns.Add (Guid.Parse (columnList [columnIndex].ID));
        }

        for (int swimlaneIndex = 0; swimlaneIndex < columnList [0].Swimlanes.Count; swimlaneIndex++)
        {
            _swimlaneTitles.Add (columnList [0].Swimlanes [swimlaneIndex].Title);
            _swimlanes.Add (Guid.Parse (columnList [0].Swimlanes [swimlaneIndex].ID));
        }

        return dropCardList;
    }
}