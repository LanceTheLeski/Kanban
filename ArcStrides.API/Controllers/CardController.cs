using ArcStrides.API.Mappers;
using ArcStrides.API.Messages;
using ArcStrides.API.Models.Board;
using ArcStrides.API.Repositories;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using Microsoft.AspNetCore.JsonPatch.SystemTextJson;
using Microsoft.AspNetCore.JsonPatch.SystemTextJson.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace ArcStrides.API.Controllers;

[ApiController]
[Route ("arcstrides/cards")]
public class CardController : ControllerBase
{
    private readonly IColumnRepository _columnRepository;
    private readonly ISwimlaneRepository _swimlaneRepository;
    private readonly ICardRepository _cardRepository;

    public CardController (IColumnRepository columnRepository,
                           ISwimlaneRepository swimlaneREpository,
                           ICardRepository cardRepository)
    {
        _columnRepository = columnRepository;
        _swimlaneRepository = swimlaneREpository;
        _cardRepository = cardRepository;
    }

    [HttpGet ("{ID:guid}")]
    public async Task<ActionResult> FetchCard (Guid ID)
    {
        var cardList = new List<Card> ();
        var cardsFromTable = await _cardRepository.GetCardsAsync (ID);

        if (cardList.Count () is 0)
            return NotFound ("The card you are searching for was not found.");
        if (cardList.Count () > 1)
            return StatusCode (StatusCodes.Status500InternalServerError, "Multiple cards were found with the same ID.");

        var cardFromDatabase = cardList.Single ();
        var cardToReturn = new CardResponse
        {
            ID = Guid.Parse (cardFromDatabase.PartitionKey),
            Title = cardFromDatabase.Title,
            Description = cardFromDatabase.Description
        };

        // Fetch other card details like Deadlines and Checklists later.

        return Ok (cardList.Single ());
    }
    
    [HttpPost ("/arcstrides/boards/{boardID:guid}/cards")]
    public async Task<ActionResult> CreateCard ([FromRoute] Guid boardID, [FromBody] CardCreateRequest cardCreateRequest)
    {
        if (cardCreateRequest is null)
        {
            return BadRequest ("There was no Card Request passed in!");
        }

        // A card is always in a column. `.Value` on a missing one threw, and came
        // back as a 500 for what is the caller's mistake.
        if (cardCreateRequest.ColumnID is not Guid columnID)
            return BadRequest (ValidatorMessages.EmptyFieldValidatorMessage (nameof (CardCreateRequest.ColumnID)));

        var columnFromTable = await _columnRepository.GetColumnAsync (boardID, columnID);
        if (columnFromTable is null)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Column)));

        // A swimlane only when the board has any. On a board with none, the card
        // goes straight into its column, as every card does once the last swimlane
        // is deleted -- see CardPosition.SwimlaneID.
        Swimlane? swimlaneFromTable = null;
        if (cardCreateRequest.SwimlaneID is Guid swimlaneID && swimlaneID != Guid.Empty)
        {
            swimlaneFromTable = await _swimlaneRepository.GetSwimlaneAsync (boardID, swimlaneID);
            if (swimlaneFromTable is null)
                return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Swimlane)));
        }
        else if ((await _swimlaneRepository.GetAllBoardSwimlanesAsync (boardID)).Count is not 0)
            return BadRequest (ErrorResponseMessages.SwimlaneRequiredErrorResponse ());

        var mapper = new CardMapper ();

        var newCardID = Guid.NewGuid ();
        var newCardPositionID = Guid.NewGuid ();
        
        var newCard = mapper.MapCardCreateRequestToCard (cardCreateRequest);
        newCard.PartitionKey = boardID.ToString ();
        newCard.RowKey = newCardID.ToString ();
        newCard.CardPositionID = newCardPositionID;
        await _cardRepository.AddCardAsync (newCard);

        var newCardPosition = new CardPosition
        {
            PartitionKey = boardID.ToString (),
            RowKey = newCardPositionID.ToString (),

            //Title = columnFromTable.BoardTitle, //Should match swimlane's BoardTitle
            CardID = newCardID,

            SwimlaneID = swimlaneFromTable is null
                ? Guid.Empty
                : Guid.Parse (swimlaneFromTable.RowKey),
            SwimlaneTitle = swimlaneFromTable?.Title ?? string.Empty,
            SwimlaneOrder = swimlaneFromTable?.SwimlaneOrder ?? 0,

            // The client sends where in the cell the card should land, because
            // it is the only party that knows what is already there. Defaults to
            // 0 -- the top of the cell -- when it says nothing.
            PositionRank = cardCreateRequest.PositionRank ?? 0,

            ColumnID = columnID,
            ColumnTitle = columnFromTable.Title,
            ColumnOrder = columnFromTable.ColumnOrder.Value,

            //CardTitle = cardCreateRequest.Title,
            //CardDescription = cardCreateRequest.Description,

        };

        //One day we will create new Card objects too with a lot of niche info. For now I just want shallow cards that we can store in the Board table

        await _cardRepository.AddCardPositionAsync (newCardPosition);
        /*if (addEntityResponse.IsError)
        {
            //We might want to have better verification later for failures. I'm thinking we actually query the table and grab the card so we can map it to a response object
            return StatusCode (StatusCodes.Status500InternalServerError, $"Could not insert a new card into database. Internal status: {addEntityResponse.Status}");
        }*/
        /*var cardResponse = new CardPositionResponse
        {
            ID = newCard.RowKey,
            //Title = newCard.CardTitle,
            //Description = newCard.CardDescription,
            ColumnID = newCard.ColumnID.ToString (),
            ColumnTitle = newCard.ColumnTitle,
            ColumnOrder = newCard.ColumnOrder,
            SwimlaneID = newCard.SwimlaneID.ToString (),
            SwimlaneTitle = newCard.SwimlaneTitle,
            SwimlaneOrder = newCard.SwimlaneOrder
        };*/

        var cardResponse = mapper.MapCardPositionToCardPositionResponse (newCardPosition);

        return StatusCode (StatusCodes.Status201Created, cardResponse);
    }

    /// <summary>
    /// Updates a card's own content (title, description, and whether it keeps
    /// dates of its own rather than its tasks').
    ///
    /// The card position endpoint on BoardController only moves a card between
    /// columns and swimlanes — Title and Description live on the Card entity, so
    /// they need this separate route.
    /// </summary>
    [HttpPatch ("/arcstrides/boards/{boardID:guid}/cards/{cardID:guid}")]
    public async Task<ActionResult> UpdateCard ([FromRoute] Guid boardID,
                                                [FromRoute] Guid cardID,
                                                [FromBody] JsonPatchDocument<CardPatchRequest> cardPatchRequest)
    {
        if (cardPatchRequest is null)
            return BadRequest ("There was no Patch Request passed in!");

        var cardToUpdate = await _cardRepository.GetCardAsync (boardID, cardID);
        if (cardToUpdate is null)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Card)));

        var convertedCardToUpdate = new CardPatchRequest
        {
            Title = cardToUpdate.Title,
            Description = cardToUpdate.Description,
            OverridesTaskTimelines = cardToUpdate.OverridesTaskTimelines
        };

        try { cardPatchRequest.ApplyTo (convertedCardToUpdate); }
        catch (JsonPatchException)
            { return BadRequest (ErrorResponseMessages.PatchRequestIsInvalidErrorResponse (nameof (Card))); }

        cardToUpdate.Title = convertedCardToUpdate.Title;
        cardToUpdate.Description = convertedCardToUpdate.Description;
        cardToUpdate.OverridesTaskTimelines = convertedCardToUpdate.OverridesTaskTimelines;

        await _cardRepository.UpdateCardAsync (cardToUpdate);

        var mapper = new CardMapper ();
        var cardResponse = mapper.MapCardToCardResponse (cardToUpdate);

        return Ok (cardResponse);
    }

    // Delete is currently offerred through the BoardController. We can adjust that so it is only offerred here. Or (unadvised) we can offer both endpoints to delete a card.
}