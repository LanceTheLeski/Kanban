using Azure.Data.Tables;
using Kanban.API.Models;
using Kanban.API.Options;
using Kanban.API.Repositories;
using Kanban.Contracts.Request.Create;
using Kanban.Contracts.Request.Patch;
using Kanban.Contracts.Response;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Kanban.API.Controllers;

[ApiController]
[Route ("kanban/tags")]
public class TagController : Controller
{
    private const string tags = "Tags";
    private const string columns = "Columns";
    private const string swimlanes = "Swimlanes";
    private const string cards = "Cards";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _boardTable;
    private readonly TableClient _columnTable;
    private readonly TableClient _swimlaneTable;
    private readonly TableClient _cardTable;

    private readonly ICardRepository _cardRepository;
    private readonly IBoardRepository _boardRepository;

    public TagController (IOptions<CosmosOptions> cosmosOptions,
                          ITagRepository cardRepository)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _boardTable = _tableServiceClient.GetTableClient (tableName: tags);
        _columnTable = _tableServiceClient.GetTableClient (tableName: columns);
        _swimlaneTable = _tableServiceClient.GetTableClient (tableName: swimlanes);
        _cardTable = _tableServiceClient.GetTableClient (tableName: cards);

        _cardRepository = cardRepository;
        _boardRepository = boardRepository;
    }

    [HttpGet ("fetch/{ID:guid}")]
    public async Task<ActionResult> FetchCard (Guid ID)
    {
        var cardList = new List<Card> ();
        var cardsFromTable = _boardTable.QueryAsync<Card> (card => card.PartitionKey == ID.ToString ());
        await foreach (var card in cardsFromTable)
            cardList.Add (card);

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

    [HttpPost ("create")]
    public async Task<ActionResult> CreateCard ([FromBody] CardCreateRequest cardCreateRequest)
    {
        if (cardCreateRequest is null)
        {
            return BadRequest ("There was no Card Request passed in!");
        }

        //An error should get thrown before this point if any of the ID's below are null. Will have a concrete validation later using ModelState or FluentValidation
        var columnFromTable = await _columnTable.GetEntityAsync<Column> (partitionKey: cardCreateRequest.ColumnID.ToString (), rowKey: cardCreateRequest.BoardID.ToString ());
        if (columnFromTable.Value is null)
            return StatusCode (StatusCodes.Status500InternalServerError, "Could not find column.");

        var swimlaneFromTable = await _swimlaneTable.GetEntityAsync<Swimlane> (partitionKey: cardCreateRequest.SwimlaneID.ToString (), rowKey: cardCreateRequest.BoardID.ToString ());
        if (swimlaneFromTable.Value is null)
            return StatusCode (StatusCodes.Status500InternalServerError, "Could not find swimlane.");

        var newCardID = Guid.NewGuid ();
        var newCard = new Board
        {
            PartitionKey = cardCreateRequest.BoardID.ToString (),
            RowKey = newCardID.ToString (),

            Title = columnFromTable.Value.BoardTitle, //Should match swimlane's BoardTitle

            SwimlaneID = cardCreateRequest.SwimlaneID,
            SwimlaneTitle = swimlaneFromTable.Value.Title,
            SwimlaneOrder = swimlaneFromTable.Value.SwimlaneOrder,

            ColumnID = cardCreateRequest.ColumnID,
            ColumnTitle = columnFromTable.Value.Title,
            ColumnOrder = columnFromTable.Value.ColumnOrder,

            CardTitle = cardCreateRequest.Title,
            CardDescription = cardCreateRequest.Description,

        };
        //One day we will create new Card objects too with a lot of niche info. For now I just want shallow cards that we can store in the Board table

        var addEntityResponse = await _boardTable.AddEntityAsync (newCard);
        if (addEntityResponse.IsError)
        {
            //We might want to have better verification later for failures. I'm thinking we actually query the table and grab the card so we can map it to a response object
            return StatusCode (StatusCodes.Status500InternalServerError, $"Could not insert a new card into database. Internal status: {addEntityResponse.Status}");
        }
        var cardResponse = new CardResponse
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

    [HttpPatch ("update/{ID:guid}")]
    public async Task<ActionResult> UpdateCard (Guid ID, [FromBody] JsonPatchDocument<CardPatchRequest> cardPatchRequest)
    {
        if (cardPatchRequest is null)
        {
            return BadRequest ("There was no Patch Request passed in!");
        }

        var cardFromTable = await _boardTable.GetEntityAsync<Board> (partitionKey: @"20a88077-10d4-4648-92cb-7dc7ba5b8df5", rowKey: ID.ToString ());
        var cardToUpdate = cardFromTable.Value;

        var convertedCardToUpdate = new CardPatchRequest
        {
            Title = cardToUpdate.CardTitle,
            Description = cardToUpdate.CardDescription,
            ColumnID = cardToUpdate.ColumnID.ToString (),
            ColumnTitle = cardToUpdate.ColumnTitle,
            ColumnOrder = cardToUpdate.ColumnOrder,
            SwimlaneID = cardToUpdate.SwimlaneID.ToString (),
            SwimlaneTitle = cardToUpdate.SwimlaneTitle,
            SwimlaneOrder = cardToUpdate.SwimlaneOrder
        };

        cardPatchRequest.ApplyTo (convertedCardToUpdate); //Could add a ModelState validation somewhere here as well..

        cardToUpdate.CardTitle = convertedCardToUpdate.Title;
        cardToUpdate.CardDescription = convertedCardToUpdate.Description;
        cardToUpdate.ColumnID = Guid.Parse (convertedCardToUpdate.ColumnID);
        cardToUpdate.ColumnTitle = convertedCardToUpdate.ColumnTitle;
        cardToUpdate.ColumnOrder = convertedCardToUpdate.ColumnOrder;
        cardToUpdate.SwimlaneID = Guid.Parse (convertedCardToUpdate.SwimlaneID);
        cardToUpdate.SwimlaneTitle = convertedCardToUpdate.SwimlaneTitle;
        cardToUpdate.SwimlaneOrder = convertedCardToUpdate.SwimlaneOrder;

        var response = await _boardTable.UpdateEntityAsync (cardToUpdate, Azure.ETag.All);
        if (response.IsError)
        {
            return BadRequest ($"Could not update card. Internal status: {response.Status}");
        }

        var cardResponse = new CardResponse
        {
            ID = cardToUpdate.RowKey,
            Title = cardToUpdate.CardTitle,
            Description = cardToUpdate.CardDescription,
            ColumnID = cardToUpdate.ColumnID.ToString (),
            ColumnTitle = cardToUpdate.ColumnTitle,
            ColumnOrder = cardToUpdate.ColumnOrder,
            SwimlaneID = cardToUpdate.SwimlaneID.ToString (),
            SwimlaneTitle = cardToUpdate.SwimlaneTitle,
            SwimlaneOrder = cardToUpdate.SwimlaneOrder
        };

        return Ok (cardResponse);
    }

    [HttpDelete ("delete/{ID:guid}")] // Need to delete from board AND card tables. There might also be extensions to remove. For now though, I'm just going to do board.
    public async Task<ActionResult> DeleteCard (Guid ID)
    {
        var cardList = new List<Card> ();
        var cardsFromTable = _boardTable.QueryAsync<Card> (card => card.PartitionKey == ID.ToString ());
        await foreach (var card in cardsFromTable)
            cardList.Add (card);

        if (cardList.Count () is 0)
            return NotFound ("The card you are searching for was not found.");

        if (cardList.Count () > 1)
            return StatusCode (StatusCodes.Status500InternalServerError, "Multiple cards were found with the same ID.");

        var cardFromDatabase = cardList.Single ();
        var cardToDelete = _boardTable.DeleteEntityAsync (cardFromDatabase.PartitionKey, cardFromDatabase.RowKey);

        if (cardToDelete.IsCompletedSuccessfully)
            return Ok (); //Is there a better Status to return? NoContent perhaps?
        else
            return StatusCode (StatusCodes.Status500InternalServerError, "Could not delete card.");
    }
}