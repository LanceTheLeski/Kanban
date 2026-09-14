using ArcStrides.API.Mappers;
using ArcStrides.API.Messages;
using ArcStrides.API.Models.Board;
using ArcStrides.API.Repositories;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using FluentValidation;
using Microsoft.AspNetCore.JsonPatch.SystemTextJson;
using Microsoft.AspNetCore.Mvc;
using System.Collections.ObjectModel;

using static ArcStrides.API.Validators.ColumnValidators;
using static ArcStrides.API.Validators.SwimlaneValidators;

namespace ArcStrides.API.Controllers;

[ApiController]
[Route ("arcstrides/boards")]
public class BoardController : Controller
{
    private readonly IValidator<IEnumerable<Swimlane>> _boardSwimlaneEnumerableValidator;
    private readonly IValidator<IEnumerable<Column>> _boardColumnEnumerableValidator;

    private readonly IColumnRepository _columnRepository;
    private readonly ISwimlaneRepository _swimlaneRepository;
    private readonly ICardRepository _cardRepository;
    private readonly ITaskRepository _taskRepository;
    private readonly ITimelineRepository _timelineRepository;

    private readonly SwimlaneMapper _swimlaneMapper;
    private readonly ColumnMapper _columnMapper;
    private readonly CardMapper _cardMapper;
    private readonly TaskMapper _taskMapper;
    private readonly TimelineMapper _timelineMapper;

    public BoardController (IColumnRepository columnRepository,
                            ISwimlaneRepository swimlaneRepository,
                            ICardRepository cardRepository,
                            ITaskRepository taskRepository,
                            ITimelineRepository timelineRepository,
                            SwimlaneMapper swimlaneMapper,
                            ColumnMapper columnMapper,
                            CardMapper cardMapper,
                            TaskMapper taskMapper,
                            TimelineMapper timelineMapper)
    {
        _columnRepository = columnRepository;
        _swimlaneRepository = swimlaneRepository;
        _cardRepository = cardRepository;
        _taskRepository = taskRepository;
        _timelineRepository = timelineRepository;

        _swimlaneMapper = swimlaneMapper;
        _columnMapper = columnMapper;
        _cardMapper = new CardMapper ();
        _taskMapper = taskMapper;
        _timelineMapper = timelineMapper;

        _boardColumnEnumerableValidator = new BoardColumnEnumerableValidator (); 
        _boardSwimlaneEnumerableValidator = new BoardSwimlaneEnumerableValidator ();
    }

    [HttpGet ("{ID:guid}")]
    public async Task<ActionResult> FetchBoard ([FromRoute] Guid ID)
    {
        var columnCollection = await _columnRepository.GetAllBoardColumns (ID);
        var columnValidationResult = _boardColumnEnumerableValidator.Validate (columnCollection);
        if (columnValidationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (Column), columnValidationResult.ToString ()));
        var columnCollectionOrdered = columnCollection.OrderBy (column => column.ColumnOrder);

        var swimlaneCollection = await _swimlaneRepository.GetAllBoardSwimlanes (ID);
        var swimlaneValidationResult = _boardSwimlaneEnumerableValidator.Validate (swimlaneCollection);
        if (swimlaneValidationResult.IsValid is false)
            // swimlaneValidationResult, not columnValidationResult. Reporting the
            // column result here meant this branch described a validation that had
            // just passed, so it stringified to nothing and the 400 came back with
            // an empty body -- a rejection that could not say what it rejected.
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (Swimlane), swimlaneValidationResult.ToString ()));
        var swimlaneCollectionOrdered = swimlaneCollection.OrderBy (swimlane => swimlane.SwimlaneOrder);

        var cardCollection = await _cardRepository.GetCardsAsync (ID);
        var cardPositionCollection = await _cardRepository.GetCardPositionsAsync (ID);
        
        var taskCollection = await _taskRepository.GetTasksAsync (ID);

        var columnResponse = new Collection<ColumnResponse> ();
        foreach (var column in columnCollectionOrdered)
        {
            var mappedColumn = _columnMapper.MapColumnToColumnResponse (column);
            columnResponse.Add (mappedColumn);
        }

        var swimlaneResponse = new Collection<SwimlaneResponse> ();
        foreach (var swimlane in swimlaneCollectionOrdered)
        {
            var mappedSwimlane = new SwimlaneResponse ();
            mappedSwimlane = _swimlaneMapper.MapSwimlaneToSwimlaneResponse (swimlane/*, mappedSwimlane*/);
            swimlaneResponse.Add (mappedSwimlane);
        }

        var taskTypeCollection = await _taskRepository.QueryTaskTypesAsync (taskType => true);
        var timelineCollection = await _timelineRepository.QueryTimelinesAsync (timeline => true);
        var cardResponse = new Collection<CardResponse> ();
        foreach (var card in cardCollection)
        {
            var cardPosition = cardPositionCollection.SingleOrDefault (cardPosition => cardPosition.RowKey == card.CardPositionID.ToString ());
            if (cardPosition is null) continue;
            
            var mappedCardPosition = _cardMapper.MapCardPositionToCardPositionResponse (cardPosition!);

            var cardTasks = taskCollection.Where (task => task.CardID.ToString () == card.RowKey);
            var mappedTasks = cardTasks.Select (_taskMapper.MapTaskToTaskResponse).ToList ();
            foreach (var mappedTask in mappedTasks)
            {
                var cardTask = cardTasks.Single (task => Guid.Parse(task.RowKey!) == mappedTask.ID);
                var taskType = taskTypeCollection.SingleOrDefault (taskType => int.Parse(taskType.RowKey) == cardTask.TaskTypeID);
                mappedTask.TaskType = _taskMapper.MapTaskTypeToTaskTypeResponse (taskType);// Assumes TaskType is real

                var taskTimeline = timelineCollection.SingleOrDefault (timeline => Guid.Parse (timeline.RowKey) == cardTask.TimelineID);
                if (taskTimeline is not null)
                    mappedTask.Timeline = _timelineMapper.MapTimelineToTimelineResponse (taskTimeline);
            }

            var mappedCard = _cardMapper.MapCardToCardResponse (card);
            mappedCard.Position = mappedCardPosition;
            mappedCard.Tasks = mappedTasks;
            
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

    [HttpPatch ("{boardID:guid}/cards/positions/{cardPositionID:guid}")]
    public async Task<ActionResult> UpdateCardPosition (Guid boardID, Guid cardPositionID, [FromBody] JsonPatchDocument<CardPositionPatchRequest> cardPatchRequest)
    {
        if (cardPatchRequest is null)
        {
            return BadRequest ("There was no Patch Request passed in!");
        }

        //var cardFromTable = await _boardTable.GetEntityAsync<BoardCard> (partitionKey: @"20a88077-10d4-4648-92cb-7dc7ba5b8df5", rowKey: cardID.ToString ());

        var cardToUpdate = await _cardRepository.GetCardPositionAsync (boardID, cardPositionID);
        //var cardToUpdate = cardFromTable.Value;

        // GetCardPositionAsync returns null for a row that is not there rather than
        // throwing, so this has to be checked before the properties below are read.
        // Dragging a card whose position row has since been deleted would otherwise
        // be a NullReferenceException.
        if (cardToUpdate is null)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (CardPosition)));

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

        var cardResponse = mapper.MapCardPositionToCardPositionResponse (cardToUpdate);

        return Ok (cardResponse);
    }

    [HttpDelete ("{boardID:guid}/cards/{cardID:guid}")] // Need to delete from board AND card tables. There might also be extensions to remove. For now though, I'm just going to do board.
    public async Task<ActionResult> DeleteCardPosition (Guid boardID, Guid cardID)
    {
        // A card and its position row have different IDs. CreateCard mints a fresh
        // Guid for the position (see CardController), stores it on the card as
        // CardPositionID, and uses it as the position row's RowKey. This used to
        // pass cardID straight in as the row key, so the lookup asked the
        // CardPositions table for a row keyed by a card ID — a row that never
        // exists — and every delete failed with ResourceNotFound (404).
        //
        // The route is keyed by cardID because that is what a client has, so go
        // through the card to find its position.
        var cardToDelete = await _cardRepository.GetCardAsync (boardID, cardID);
        if (cardToDelete is null)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Card)));

        if (cardToDelete.CardPositionID is null)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (CardPosition)));

        var boardCardToDelete = await _cardRepository.GetCardPositionAsync (boardID, cardToDelete.CardPositionID.Value);
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