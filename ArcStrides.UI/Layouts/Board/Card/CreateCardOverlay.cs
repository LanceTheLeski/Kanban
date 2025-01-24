using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Components.ArcOverlay;
using ArcStrides.UI.Mappers;
using ArcStrides.UI.Models;
using Newtonsoft.Json;
using System.Net.Http.Headers;

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

    private string columnToAddCard = string.Empty;
    private void SetColumnNameToAddCard (string columnName)
    {
        var matchingColumnNameCount = ColumnTitles?.FindAll (column => column == columnName).Count ();
        if (matchingColumnNameCount is not 1)
        {
            // Should we throw exceptions? Or have the snackbar display exceptions?
            // I think that the UI should throw exceptions and the Blazor UI should maybe use something reliable like the snackbar.
            throw new Exception ($"The column selected does not correspond to a single column in our list of columns. Number of this column found: {matchingColumnNameCount}");
        }

        columnToAddCard = columnName;
    }

    private string swimlaneToAddCard = string.Empty;
    private void SetSwimlaneNameToAddCard (string swimlaneName)
    {
        var matchingSwimlaneNameCount = SwimlaneTitles?.FindAll (swimlane => swimlane == swimlaneName).Count ();
        if (matchingSwimlaneNameCount is not 1)
        {
            // Should we throw exceptions? Or have the snackbar display exceptions?
            // I think that the UI should throw exceptions and the Blazor UI should maybe use something reliable like the snackbar.
            throw new Exception ($"The swimlane selected does not correspond to a single column in our list of swimlanes. Number of this swimlane found: {matchingSwimlaneNameCount}");
        }

        swimlaneToAddCard = swimlaneName;
    }

    public async Task<CardPositionResponse> CreateCard () //We will probably want a restriction down the road that swimlanes and columns don't have duplicate titles
    {
        var createRequest = new CardCreateRequest
        {
            Title = cardTitle,
            Description = cardDescription,
            //BoardID = Guid.Parse ("20a88077-10d4-4648-92cb-7dc7ba5b8df5"),
            ColumnID = Columns [ColumnTitles.IndexOf (columnToAddCard)],
            SwimlaneID = Swimlanes [SwimlaneTitles.IndexOf (swimlaneToAddCard)]
        };

        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Post, @$"{interfaceOptions.Value.URL}ArcStrides/cards");
        httpRequestMessage.Content = new StringContent (JsonConvert.SerializeObject (createRequest), mediaType: new MediaTypeHeaderValue (@"application/json"));

        var response = await http.SendAsync (httpRequestMessage);
        if (response.IsSuccessStatusCode)
        {
            var responseBody = await response.Content.ReadAsStringAsync ();
            var deserialized = JsonConvert.DeserializeObject<CardPositionResponse> (responseBody);

            //Add it to the DropCard list? And if we want to use the boardResponse as a source of truth then that too? But I don't think that should be the case
            var mapper = new CardMapper ();
            var dropCard = mapper.MapCardPositionResponseToDropCard (deserialized);
            dropCard.CardArea = ConvertColumnAndSwimlaneToCardArea (deserialized.SwimlaneOrder.Value, deserialized.ColumnOrder.Value);
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

            return deserialized;
        }

        return null;
    }

    private string ConvertColumnAndSwimlaneToCardArea (int swimlanePos, int columnPos)
    {
        return (swimlanePos + "_" + columnPos);
    }
}