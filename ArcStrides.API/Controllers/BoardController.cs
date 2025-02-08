using ArcStrides.API.Mappers;
using ArcStrides.API.Messages;
using ArcStrides.API.Models.Board;
using ArcStrides.API.Repositories;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using System.Collections.ObjectModel;

namespace ArcStrides.API.Controllers;

[ApiController]
[Route ("arcstrides/boards")]
public class BoardController : Controller
{
    private readonly IColumnRepository _columnRepository;
    private readonly ISwimlaneRepository _swimlaneRepository;
    private readonly ICardRepository _cardRepository;
    private readonly ITaskRepository _taskRepository;

    private readonly SwimlaneMapper _swimlaneMapper;
    private readonly ColumnMapper _columnMapper;
    private readonly CardMapper _cardMapper;
    private readonly TaskMapper _taskMapper;

    public BoardController (IColumnRepository columnRepository,
                            ISwimlaneRepository swimlaneRepository,
                            ICardRepository cardRepository,
                            ITaskRepository taskRepository,
                            SwimlaneMapper swimlaneMapper,
                            ColumnMapper columnMapper,
                            CardMapper cardMapper,
                            TaskMapper taskMapper)
    {
        _columnRepository = columnRepository;
        _swimlaneRepository = swimlaneRepository;
        _cardRepository = cardRepository;
        _taskRepository = taskRepository;

        _swimlaneMapper = swimlaneMapper;
        _columnMapper = columnMapper;
        _cardMapper = new CardMapper ();
        _taskMapper = taskMapper;
    }

    [HttpGet ("{ID:guid}")]
    public async Task<ActionResult> FetchBoard (Guid ID)
    {
        //var cardPositionCollection = await _cardRepository.GetCardPositionsAsync (ID);

        var columnCollection = await _columnRepository.GetAllBoardColumns (ID);
        // Validate that the colums have a distinct order and likely some unique names as well? Maybe also the same board name?
        var columnCollectionOrdered = columnCollection.OrderBy (column => column.ColumnOrder);

        var swimlaneCollection = await _swimlaneRepository.GetAllBoardSwimlanes (ID);
        // Validate that the swimlanes have a distinct order and likely some unique names as well? Maybe also the same board name?
        var swimlaneCollectionOrdered = swimlaneCollection.OrderBy (swimlane => swimlane.SwimlaneOrder);

        var cardCollection = await _cardRepository.GetCardsAsync (ID);
        var cardPositionCollection = await _cardRepository.GetCardPositionsAsync (ID);

        var columnResponse = new Collection<ColumnResponse> ();
        foreach (var column in columnCollectionOrdered)
        {
            var mappedColumn = new ColumnResponse ();
            _columnMapper.MapColumnToColumnResponse (column, mappedColumn);
            columnResponse.Add (mappedColumn);
        }

        var swimlaneResponse = new Collection<SwimlaneResponse> ();
        foreach (var swimlane in swimlaneCollectionOrdered)
        {
            var mappedSwimlane = new SwimlaneResponse ();
            mappedSwimlane = _swimlaneMapper.MapSwimlaneToSwimlaneResponse (swimlane/*, mappedSwimlane*/);
            swimlaneResponse.Add (mappedSwimlane);
        }

        var cardResponse = new Collection<CardResponse> ();
        foreach (var card in cardCollection)
        {
            var cardPosition = cardPositionCollection.SingleOrDefault (cardPosition => cardPosition.RowKey == card.CardPositionID.ToString ());

            CardPositionResponse mappedCardPosition = new ();
            if (cardPosition is null) ;//??
            _cardMapper.MapCardPositionToCardPositionResponse (cardPosition!, mappedCardPosition);

            CardResponse mappedCard = new ();
            _cardMapper.MapCardToCardResponse (card, mappedCard);
            mappedCard.Position = mappedCardPosition;
            cardResponse.Add (mappedCard);
        }

        var boardResponse = new BoardResponse
        {
            ID = ID,
            Title = "Placeholder..",
            Swimlanes = swimlaneResponse,
            Columns = columnResponse,
            Cards = cardResponse
        };
        return Ok (boardResponse);
    }

    [HttpPost ("")]
    public ActionResult CreateBoard ()
    {
        //todo

        return StatusCode (StatusCodes.Status418ImATeapot);
    }

    [HttpPatch ("{ID:guid}")]
    public ActionResult UpdateBoard ()
    {
        //todo

        return StatusCode (StatusCodes.Status418ImATeapot);
    }

    [HttpDelete ("{ID:guid}")]
    public ActionResult DeleteBoard ()
    {
        //todo

        return StatusCode (StatusCodes.Status418ImATeapot);
    }

    [HttpPatch ("{boardID:guid}/cards/{cardID:guid}")]
    public async Task<ActionResult> UpdateCardPosition (Guid boardID, Guid cardID, [FromBody] JsonPatchDocument<CardPositionPatchRequest> cardPatchRequest)
    {
        if (cardPatchRequest is null)
        {
            return BadRequest ("There was no Patch Request passed in!");
        }

        //var cardFromTable = await _boardTable.GetEntityAsync<BoardCard> (partitionKey: @"20a88077-10d4-4648-92cb-7dc7ba5b8df5", rowKey: cardID.ToString ());

        var cardToUpdate = await _cardRepository.GetCardPositionAsync (boardID, cardID);
        //var cardToUpdate = cardFromTable.Value;

        var convertedCardToUpdate = new CardPositionPatchRequest
        {
            //Title = cardToUpdate.CardTitle,
            //Description = cardToUpdate.CardDescription,
            ColumnID = cardToUpdate.ColumnID,
            ColumnTitle = cardToUpdate.ColumnTitle,
            ColumnOrder = cardToUpdate.ColumnOrder,
            SwimlaneID = cardToUpdate.SwimlaneID,
            SwimlaneTitle = cardToUpdate.SwimlaneTitle,
            SwimlaneOrder = cardToUpdate.SwimlaneOrder
        };

        cardPatchRequest.ApplyTo (convertedCardToUpdate); //Could add a ModelState validation somewhere here as well..

        //cardToUpdate.CardTitle = convertedCardToUpdate.Title;
        //cardToUpdate.CardDescription = convertedCardToUpdate.Description;
        cardToUpdate.ColumnID = convertedCardToUpdate.ColumnID.Value;
        cardToUpdate.ColumnTitle = convertedCardToUpdate.ColumnTitle;
        cardToUpdate.ColumnOrder = convertedCardToUpdate.ColumnOrder.Value;
        cardToUpdate.SwimlaneID = convertedCardToUpdate.SwimlaneID.Value;
        cardToUpdate.SwimlaneTitle = convertedCardToUpdate.SwimlaneTitle;
        cardToUpdate.SwimlaneOrder = convertedCardToUpdate.SwimlaneOrder.Value;

        await _cardRepository.UpdateCardPositionAsync (cardToUpdate);
        /*if (response.IsError)
        {
            return BadRequest ($"Could not update card. Internal status: {response.Status}");
        }*/

        /*var cardResponse = new CardPositionResponse
        {
            ID = cardToUpdate.RowKey,
            //Title = cardToUpdate.CardTitle,
            //Description = cardToUpdate.CardDescription,
            ColumnID = cardToUpdate.ColumnID.ToString (),
            ColumnTitle = cardToUpdate.ColumnTitle,
            ColumnOrder = cardToUpdate.ColumnOrder,
            SwimlaneID = cardToUpdate.SwimlaneID.ToString (),
            SwimlaneTitle = cardToUpdate.SwimlaneTitle,
            SwimlaneOrder = cardToUpdate.SwimlaneOrder
        };*/
        var mapper = new CardMapper ();

        CardPositionResponse cardResponse = new ();
        mapper.MapCardPositionToCardPositionResponse (cardToUpdate, cardResponse);

        return Ok (cardResponse);
    }

    [HttpDelete ("{boardID:guid}/cards/{cardID:guid}")] // Need to delete from board AND card tables. There might also be extensions to remove. For now though, I'm just going to do board.
    public async Task<ActionResult> DeleteCardPosition (Guid boardID, Guid cardID)
    {
        var boardCardToDelete = await _cardRepository.GetCardPositionAsync (boardID, cardID);
        if (boardCardToDelete is null)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (CardPosition)));

        await _cardRepository.DeleteCardPositionAsync (boardCardToDelete);
        /*if (boardCardToDeleteResponse.IsError)
            return Problem (ErrorResponseMessages.RemoveFromDatabaseErrorResponse (nameof (BoardCard)));*/

        // Ideally here we will then delete the same card from the card database.
        // Since transactions can only be done on data objects of the same partition key,
        // I think the best immediate solution will be to re-add boardcards in the event
        // that a card fails to be deleted in the card database.
        // A good long-term solution can be to try and really make transactions work by
        // partitioning everything by a board ID. But that will have its pitfalls and may
        // even go against the initial design of this board (in that we want to be able
        // to create board on the fly of existing objects).

        return Ok ();
    }
}