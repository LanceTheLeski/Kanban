using ArcStrides.API.Mappers;
using ArcStrides.API.Messages;
using ArcStrides.API.Models.Board;
using ArcStrides.API.Repositories;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;

namespace ArcStrides.API.Controllers;

[ApiController]
[Route ("arcstrides/boards")]
public class BoardController : Controller
{
    private readonly IColumnRepository _columnRepository;
    private readonly ISwimlaneRepository _swimlaneRepository;
    private readonly ICardRepository _cardRepository;
    private readonly ITaskRepository _taskRepository;

    private readonly ITaskMapper _taskMapper;

    public BoardController (IColumnRepository columnRepository,
                            ISwimlaneRepository swimlaneRepository,
                            ICardRepository cardRepository,
                            ITaskRepository taskRepository,
                            ITaskMapper taskMapper)
    {
        _columnRepository = columnRepository;
        _swimlaneRepository = swimlaneRepository;
        _cardRepository = cardRepository;
        _taskRepository = taskRepository;

        _taskMapper = taskMapper;
    }

    [HttpGet ("{ID:guid}")]
    public async Task<ActionResult> FetchBoard (Guid ID)
    {
        var cardPositionCollection = await _cardRepository.GetCardPositionsAsync (ID);

        var columnCollection = await _columnRepository.GetAllBoardColumns (ID);
        // Validate that the colums have a distinct order and likely some unique names as well? Maybe also the same board name?
        var columnCollectionOrdered = columnCollection.OrderBy (column => column.ColumnOrder);

        var swimlaneCollection = await _swimlaneRepository.GetAllBoardSwimlanes (ID);
        // Validate that the swimlanes have a distinct order and likely some unique names as well? Maybe also the same board name?
        var swimlaneCollectionOrdered = swimlaneCollection.OrderBy (swimlane => swimlane.SwimlaneOrder);

        var boardResponse = new BoardResponse ();
        foreach (var column in columnCollectionOrdered)
        {

        }
        /*foreach (var column in columnCollectionOrdered)
        {
            var swimlanes = new Collection<BoardResponse.BasicSwimlane> ();
            foreach (var swimlane in swimlaneCollectionOrdered)
            {
                var boardCardEnumarable = boardCardCollection.Where (boardCard => boardCard.ColumnID == Guid.Parse (column.PartitionKey) 
                                                                                  && boardCard.SwimlaneID == Guid.Parse (swimlane.PartitionKey));

                var cards = new Collection<BoardResponse.BasicCard> ();
                foreach (var boardCard in boardCardEnumarable)
                {
                    var taskCollection = await _taskRepository.QueryTasksAsync (task => task.RowKey == boardCard.RowKey);
                    
                    var cardTasks = new Collection<TaskResponse> ();
                    foreach (var task in taskCollection)
                        cardTasks.Add (_taskMapper.MapTaskToTaskResponse (task));

                    cards.Add (new BoardResponse.BasicCard // I want to circleu back to breaking this object up after this refactoring. It needs to be better soon.
                    {
                        ID = boardCard.RowKey,
                        Title = boardCard.CardTitle,
                        Description = boardCard.CardDescription,
                        Tasks = cardTasks
                    });
                }

                swimlanes.Add (new BoardResponse.BasicSwimlane
                {
                    ID = swimlane.PartitionKey,
                    Title = swimlane.Title,
                    Order = swimlane.SwimlaneOrder,
                    Cards = cards
                });
            }

            boardResponse.Columns.Add (new BoardResponse.BasicColumn
            {
                ID = column.PartitionKey,
                Title = column.Title,
                Order = column.ColumnOrder,
                Swimlanes = swimlanes
            });
        }*/

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
            ColumnID = cardToUpdate.ColumnID.ToString (),
            ColumnTitle = cardToUpdate.ColumnTitle,
            ColumnOrder = cardToUpdate.ColumnOrder,
            SwimlaneID = cardToUpdate.SwimlaneID.ToString (),
            SwimlaneTitle = cardToUpdate.SwimlaneTitle,
            SwimlaneOrder = cardToUpdate.SwimlaneOrder
        };

        cardPatchRequest.ApplyTo (convertedCardToUpdate); //Could add a ModelState validation somewhere here as well..

        //cardToUpdate.CardTitle = convertedCardToUpdate.Title;
        //cardToUpdate.CardDescription = convertedCardToUpdate.Description;
        cardToUpdate.ColumnID = Guid.Parse (convertedCardToUpdate.ColumnID);
        cardToUpdate.ColumnTitle = convertedCardToUpdate.ColumnTitle;
        cardToUpdate.ColumnOrder = convertedCardToUpdate.ColumnOrder;
        cardToUpdate.SwimlaneID = Guid.Parse (convertedCardToUpdate.SwimlaneID);
        cardToUpdate.SwimlaneTitle = convertedCardToUpdate.SwimlaneTitle;
        cardToUpdate.SwimlaneOrder = convertedCardToUpdate.SwimlaneOrder;

        await _cardRepository.UpdateCardPositionAsync (cardToUpdate);
        /*if (response.IsError)
        {
            return BadRequest ($"Could not update card. Internal status: {response.Status}");
        }*/

        var cardResponse = new CardPositionResponse
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
        };

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