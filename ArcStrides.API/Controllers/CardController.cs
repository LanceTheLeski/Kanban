using ArcStrides.API.Models;
using ArcStrides.API.Repositories;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
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
        var cardsFromTable = await _cardRepository.GetCardsAsync(ID);

        if (cardList.Count () is 0)
            return NotFound ("The card you are searching for was not found.");
        if (cardList.Count () > 1)
            return StatusCode (StatusCodes.Status500InternalServerError, "Multiple cards were found with the same ID.");

        var cardFromDatabase = cardList.Single ();
        var cardToReturn = new CardDetailsResponse
        {
            ID = cardFromDatabase.PartitionKey,
            Title = cardFromDatabase.Title,
            Description = cardFromDatabase.Description
        };

        // Fetch other card details like Deadlines and Checklists later.

        return Ok (cardList.Single ());
    }

    [HttpPost]
    public async Task<ActionResult> CreateCard ([FromBody] CardCreateRequest cardCreateRequest)
    {
        if (cardCreateRequest is null)
        {
            return BadRequest ("There was no Card Request passed in!");
        }

        //An error should get thrown before this point if any of the ID's below are null. Will have a concrete validation later using ModelState or FluentValidation
        var columnFromTable = await _columnRepository.GetColumnAsync (cardCreateRequest.ColumnID, cardCreateRequest.BoardID);
        if (columnFromTable is null)
            return StatusCode (StatusCodes.Status500InternalServerError, "Could not find column.");

        var swimlaneFromTable = await _swimlaneRepository.GetSwimlaneAsync (cardCreateRequest.SwimlaneID, cardCreateRequest.BoardID);
        if (swimlaneFromTable is null)
            return StatusCode (StatusCodes.Status500InternalServerError, "Could not find swimlane.");

        var newCardID = Guid.NewGuid ();
        var newCard = new BoardCard
        {
            PartitionKey = cardCreateRequest.BoardID.ToString (),
            RowKey = newCardID.ToString (),

            Title = columnFromTable.BoardTitle, //Should match swimlane's BoardTitle

            SwimlaneID = cardCreateRequest.SwimlaneID,
            SwimlaneTitle = swimlaneFromTable.Title,
            SwimlaneOrder = swimlaneFromTable.SwimlaneOrder,

            ColumnID = cardCreateRequest.ColumnID,
            ColumnTitle = columnFromTable.Title,
            ColumnOrder = columnFromTable.ColumnOrder,

            CardTitle = cardCreateRequest.Title,
            CardDescription = cardCreateRequest.Description,

        };
        //One day we will create new Card objects too with a lot of niche info. For now I just want shallow cards that we can store in the Board table

        await _cardRepository.AddBoardCardAsync (newCard);
        /*if (addEntityResponse.IsError)
        {
            //We might want to have better verification later for failures. I'm thinking we actually query the table and grab the card so we can map it to a response object
            return StatusCode (StatusCodes.Status500InternalServerError, $"Could not insert a new card into database. Internal status: {addEntityResponse.Status}");
        }*/
        var cardResponse = new BoardCardResponse
        {
            ID = newCard.RowKey.ToString (),
            Title = newCard.CardTitle,
            Description = newCard.CardDescription,
            ColumnID = newCard.ColumnID.ToString (),
            ColumnTitle = newCard.ColumnTitle,
            ColumnOrder = newCard.ColumnOrder,
            SwimlaneID = newCard.SwimlaneID.ToString (),
            SwimlaneTitle = newCard.SwimlaneTitle,
            SwimlaneOrder = newCard.SwimlaneOrder
        };

        return StatusCode (StatusCodes.Status201Created, cardResponse);
    }

    // Delete is currently offerred through the BoardController. We can adjust that so it is only offerred here. Or (unadvised) we can offer both endpoints to delete a card.
}