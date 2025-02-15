using ArcStrides.Contracts.Response;
using ArcStrides.UI.Models;
using MudBlazor;

namespace ArcStrides.UI.Pages;

public partial class Board
{
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

    private async Task<CardPositionResponse?> SendCardPatchRequest (DropCard cardToUpdate)
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

        return await _cardRepository.UpdateCardPositionAsync (cardToUpdate.Id, patchRequest);
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

        var columnList = (List<ColumnResponse>) boardResponse.Columns;
        var swimlaneList = (List<SwimlaneResponse>) boardResponse.Swimlanes;
        for (int columnIndex = 0; columnIndex < columnList.Count; columnIndex ++)
        {
            for (int swimlaneIndex = 0; swimlaneIndex < swimlaneList.Count (); swimlaneIndex ++)
            {
                var cardList = boardResponse.Cards.Where (card => card.Position.ColumnOrder == columnIndex && card.Position.SwimlaneOrder == swimlaneIndex);

                var cardArea = ConvertColumnAndSwimlaneToCardArea (swimlaneList [swimlaneIndex].Order.Value, columnList [columnIndex].Order.Value);
                foreach (var card in cardList)
                {
                    dropCardList.Add (new DropCard
                    {
                        Id = card.ID.Value,
                        Title = card.Title,
                        Description = card.Description,
                        ColumnNumber = columnIndex,
                        ColumnID = columnList [columnIndex].ID.Value,
                        ColumnName = columnList [columnIndex].Title,
                        SwimlaneNumber = swimlaneIndex,
                        SwimlaneID = swimlaneList [swimlaneIndex].ID.Value,
                        SwimlaneName = swimlaneList [swimlaneIndex].Title,
                        Tasks = card.Tasks?.ToList(),
                        CardArea = cardArea
                    });
                }
            }

            _columnTitles.Add (columnList [columnIndex].Title);
            _columns.Add (columnList [columnIndex].ID.Value);
        }

        for (int swimlaneIndex = 0; swimlaneIndex < swimlaneList.Count (); swimlaneIndex++)
        {
            _swimlaneTitles.Add (swimlaneList [swimlaneIndex].Title);
            _swimlanes.Add (swimlaneList [swimlaneIndex].ID.Value);
        }

        return dropCardList;
    }
}