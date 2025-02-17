using ArcStrides.Contracts.Request.Create;
using ArcStrides.UI.Components.ArcOverlay;
using ArcStrides.UI.Mappers;
using ArcStrides.UI.Models.Board;

namespace ArcStrides.UI.Layouts.Board.Card;

public partial class CreateCardOverlay : IArcOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }

    private void SetColumnNameToAddCard (string columnName)
    {
        var matchingColumnNameCount = ColumnTitles?.FindAll (column => column == columnName).Count ();
        if (matchingColumnNameCount is not 1)
        {
            // Should we throw exceptions? Or have the snackbar display exceptions?
            // I think that the UI should throw exceptions and the Blazor UI should maybe use something reliable like the snackbar.
            throw new Exception ($"The column selected does not correspond to a single column in our list of columns. Number of this column found: {matchingColumnNameCount}");
        }

        _columnToAddCard = columnName;
    }

    private void SetSwimlaneNameToAddCard (string swimlaneName)
    {
        var matchingSwimlaneNameCount = SwimlaneTitles?.FindAll (swimlane => swimlane == swimlaneName).Count ();
        if (matchingSwimlaneNameCount is not 1)
        {
            // Should we throw exceptions? Or have the snackbar display exceptions?
            // I think that the UI should throw exceptions and the Blazor UI should maybe use something reliable like the snackbar.
            throw new Exception ($"The swimlane selected does not correspond to a single column in our list of swimlanes. Number of this swimlane found: {matchingSwimlaneNameCount}");
        }

        _swimlaneToAddCard = swimlaneName;
    }

    public async System.Threading.Tasks.Task CreateCardAsync () //We will probably want a restriction down the road that swimlanes and columns don't have duplicate titles
    {
        var createRequest = new CardCreateRequest
        {
            Title = _cardTitle,
            Description = _cardDescription,
            ColumnID = Columns [ColumnTitles.IndexOf (_columnToAddCard)],
            SwimlaneID = Swimlanes [SwimlaneTitles.IndexOf (_swimlaneToAddCard)]
        };

        var cardPositionResponse = await _cardRepository.CreateCardPositionAsync (createRequest);

        //Do validation here..

        //Add it to the DropCard list? And if we want to use the boardResponse as a source of truth then that too? But I don't think that should be the case
        var mapper = new CardMapper ();
        var card = mapper.MapCardPositionResponseToCard (cardPositionResponse);
        var dropCard = (DropCard) card;
        dropCard.CardArea = ConvertColumnAndSwimlaneToCardArea (cardPositionResponse.SwimlaneOrder.Value, cardPositionResponse.ColumnOrder.Value);
        Cards.Add (dropCard);
        /*Cards.Add (new DropCard
        {
            Id = deserialized.ID,
            Title = deserialized.Title,
            Description = deserialized.Description,
            ColumnNumber = deserialized.ColumnOrder,
            ColumnID = Guid.Parse (deserialized.ColumnID),
            ColumnName = deserialized.ColumnTitle,
            SwimlaneNumber = deserialized.SwimlaneOrder,
            SwimlaneID = Guid.Parse (deserialized.SwimlaneID),
            SwimlaneName = deserialized.SwimlaneTitle,
            CardArea = ConvertColumnAndSwimlaneToCardArea (deserialized.SwimlaneOrder, deserialized.ColumnOrder)
            */

        Refresh.InvokeAsync (true);
    }

    private string ConvertColumnAndSwimlaneToCardArea (int swimlanePos, int columnPos)
    {
        return (swimlanePos + "_" + columnPos);
    }
}