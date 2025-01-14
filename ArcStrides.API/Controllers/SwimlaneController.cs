using ArcStrides.API.Exceptions;
using ArcStrides.API.Mappers;
using ArcStrides.API.Messages;
using ArcStrides.API.Models.Board;
using ArcStrides.API.Repositories;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using Azure;
using DeepCopy;
using FluentValidation;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.JsonPatch.Exceptions;
using Microsoft.AspNetCore.Mvc;
using System.Collections.ObjectModel;

using static ArcStrides.API.Validators.SwimlaneValidators;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Controllers;

[ApiController]
[Route ("arcstrides/swimlanes")]
public class SwimlaneController : ArcController
{
    private readonly IValidator<SwimlaneCreateRequest> _swimlaneCreateRequestValidator;
    private readonly IValidator<JsonPatchDocument<SwimlanePatchRequest>> _swimlanePatchRequestDocumentValidator;

    private readonly ISwimlaneMapper _swimlaneMapper;

    private readonly ISwimlaneRepository _swimlaneRepository;
    private readonly ICardRepository _cardRepository;

    public SwimlaneController (ISwimlaneRepository swimlaneRepository,
                             ICardRepository cardRepository)
    {
        _swimlaneCreateRequestValidator = new SwimlaneCreateRequestValidator ();
        _swimlanePatchRequestDocumentValidator = new SwimlanePatchRequestDocumentValidator ();

        _swimlaneMapper = new SwimlaneMapper ();

        _swimlaneRepository = swimlaneRepository;
        _cardRepository = cardRepository;
    }

    [HttpGet ("{ID:guid}")]
    public async Task<ActionResult> FetchSwimlane (Guid ID)
    {
        try
        {
            var swimlaneFromDatabase = await FetchAndValidateSwimlane (ID);

            var swimlaneResponse = _swimlaneMapper.MapSwimlaneToSwimlaneResponse (swimlaneFromDatabase);
            return Ok (swimlaneResponse);
        }
        catch (RequestFailureWrapperException requestFailureWrapper)
        { return ArcErrorResponse (requestFailureWrapper); }
    }

    [HttpPost ("/arcstrides/boards/{boardID:guid}/swimlanes")]
    public async Task<ActionResult> CreateBoardSwimlane ([FromRoute] Guid boardID, [FromBody] SwimlaneCreateRequest swimlaneCreateRequest)
    {
        var validationResult = _swimlaneCreateRequestValidator.Validate (swimlaneCreateRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (SwimlaneCreateRequest), validationResult.ToString ()));

        try
        {
            var boardCardEnumerableFromDatabase = await FetchAndValidateBoardCardsAsync (boardID);

            var newSwimlane = _swimlaneMapper.MapSwimlaneCreateRequestToSwimlane (swimlaneCreateRequest);
            newSwimlane.PartitionKey = Guid.NewGuid ().ToString ();
            newSwimlane.RowKey = boardID.ToString ();
            newSwimlane.BoardTitle = boardCardEnumerableFromDatabase.First ().Title;

            await AddSwimlaneAndUpdateEffectedSwimlanesAndBoardCards (newSwimlane, boardCardEnumerableFromDatabase);

            var swimlaneResponse = _swimlaneMapper.MapSwimlaneToSwimlaneResponse (newSwimlane);
            return Created (default (Uri)/*Generate this later*/, swimlaneResponse);
        }
        catch (RequestFailureWrapperException requestFailureWrapper)
        { return ArcErrorResponse (requestFailureWrapper); }
    }

    [HttpPatch ("/arcstrides/boards/{boardID:Guid}/swimlanes/{swimlaneID:Guid}")]
    public async Task<ActionResult> UpdateBoardSwimlane (Guid boardID, Guid swimlaneID, [FromBody] JsonPatchDocument<SwimlanePatchRequest> swimlanePatchRequest)
    {
        var validationResult = _swimlanePatchRequestDocumentValidator.Validate (swimlanePatchRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (SwimlanePatchRequest), validationResult.ToString ()));

        try
        {
            var swimlanesFromBoard = await FetchAndValidateAllBoardSwimlanesAsync (boardID);

            var swimlaneToUpdate = swimlanesFromBoard.FirstOrDefault (swimlane => swimlane.PartitionKey == swimlaneID.ToString ());
            if (swimlaneToUpdate is null)
                return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Swimlane)));

            var convertedSwimlaneToUpdate = _swimlaneMapper.MapSwimlaneToSwimlanePatchRequest (swimlaneToUpdate);
            try { swimlanePatchRequest.ApplyTo (convertedSwimlaneToUpdate); }
            catch (JsonPatchException)
            { return BadRequest (ErrorResponseMessages.PatchRequestIsInvalidErrorResponse (nameof (Swimlane))); }
            ValidateConvertedSwimlaneAgainstBoardSwimlanes (swimlaneToUpdate, convertedSwimlaneToUpdate, swimlanesFromBoard);

            var updatedSwimlane = await UpdateSwimlaneAndUpdateEffectedSwimlanesAndBoardCards (boardID, swimlanesFromBoard, swimlaneToUpdate, convertedSwimlaneToUpdate, swimlanePatchRequest.Operations);

            var swimlaneResponse = _swimlaneMapper.MapSwimlaneToSwimlaneResponse (updatedSwimlane);
            return Ok (swimlaneResponse);
        }
        catch (RequestFailureWrapperException requestFailureWrapper)
        { return ArcErrorResponse (requestFailureWrapper); }
    }

    [HttpDelete ("/arcstrides/boards/{boardID:guid}/swimlanes/{swimlaneID:guid}")]
    public async Task<ActionResult> DeleteBoardSwimlane (Guid boardID, Guid swimlaneID)
    {
        try
        {
            var swimlaneToDelete = await FetchAndValidateSwimlane (swimlaneID);

            await DeleteSwimlaneAndUpdateEffectedSwimlanesAndBoardCards (boardID, swimlaneToDelete);
            return Ok ();
        }
        catch (RequestFailureWrapperException requestFailureWrapper)
        { return ArcErrorResponse (requestFailureWrapper); }
    }

    /// <summary>
    /// Attempts to fetch a single swimlane based on its ID. If a single swimlane 
    /// is not returned then the request fails.
    /// </summary>
    private async Task<Swimlane> FetchAndValidateSwimlane (Guid swimlaneID)
    {
        IEnumerable<Swimlane>? swimlaneEnumerableFromDatabase = null;
        try { await _swimlaneRepository.GetSwimlanesAsync (swimlaneID); }
        catch (RequestFailedException reqFailedEx)
        {
            throw new RequestFailureWrapperException (nameof (Problem),
                                                      ErrorResponseMessages.FetchFromDatabaseErrorResponse (nameof (Swimlane), reqFailedEx.Status));
        }

        if (swimlaneEnumerableFromDatabase!.Count () is 0)
            throw new RequestFailureWrapperException (nameof (NotFound),
                                                      ErrorResponseMessages.NotFoundErrorResponse (nameof (Swimlane)));
        if (swimlaneEnumerableFromDatabase!.Count () is not 1)
            throw new RequestFailureWrapperException (nameof (Problem),
                                                      ErrorResponseMessages.TooManyEntitiesErrorResponse (nameof (Swimlane)));

        return swimlaneEnumerableFromDatabase!.Single ();
    }

    /// <summary>
    /// Attempts to fetch a collection of swimlanes that are all associated to 
    /// a board by that board's ID.
    /// </summary>
    private async Task<IEnumerable<Swimlane>> FetchAndValidateAllBoardSwimlanesAsync (Guid boardID)
    {
        try { return await _swimlaneRepository.GetAllBoardSwimlanes (boardID); }
        catch (RequestFailedException reqFailedEx)
        {
            throw new RequestFailureWrapperException (nameof (Problem),
                                                      ErrorResponseMessages.FetchFromDatabaseErrorResponse (nameof (Swimlane), reqFailedEx.Status));
        }
    }

    /// <summary>
    /// Attempts to fetch a collection of board cards that are all all associated
    /// to a board by that board's ID.
    /// </summary>
    private async Task<IEnumerable<CardPosition>> FetchAndValidateBoardCardsAsync (Guid boardID)
    {
        IEnumerable<CardPosition>? boardCardEnumerableFromDatabase = null;
        try { boardCardEnumerableFromDatabase = await _cardRepository.GetCardPositionsAsync (boardID); }
        catch (RequestFailedException reqFailedEx)
        {
            throw new RequestFailureWrapperException (nameof (Problem),
                                                      ErrorResponseMessages.FetchFromDatabaseErrorResponse (nameof (CardPosition), reqFailedEx.Status));
        }

        return boardCardEnumerableFromDatabase;
    }

    /// <summary>
    /// 
    /// </summary>
    private void ValidateConvertedSwimlaneAgainstBoardSwimlanes (Swimlane swimlaneToUpdate, SwimlanePatchRequest convertedSwimlaneToUpdate, IEnumerable<Swimlane> swimlanesFromBoard)
    {
        if (convertedSwimlaneToUpdate.Order is not 0
            && convertedSwimlaneToUpdate.Order <= swimlanesFromBoard.Count ())
            throw new RequestFailureWrapperException (nameof (BadRequest),
                                                      ErrorResponseMessages.ValidationFailedErrorResponse (nameof (Swimlane), ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (Swimlane.SwimlaneOrder))));

        var swimlanesWithoutSwimlaneToUpdate = DeepCopier.Copy (swimlanesFromBoard.ToList ());
        swimlanesWithoutSwimlaneToUpdate.Remove (swimlaneToUpdate);
        if (convertedSwimlaneToUpdate.Title is not null
            && swimlanesWithoutSwimlaneToUpdate.Any (swimlane => string.Equals (swimlane.Title, convertedSwimlaneToUpdate.Title, StringComparison.OrdinalIgnoreCase)))
            throw new RequestFailureWrapperException (nameof (BadRequest),
                                                      ErrorResponseMessages.ValidationFailedErrorResponse (nameof (Swimlane), ValidatorMessages.DuplicateFieldValidatorMessage (nameof (Swimlane.Title))));
    }

    /// <summary>
    /// 
    /// </summary>
    private async Task AddSwimlaneAndUpdateEffectedSwimlanesAndBoardCards (Swimlane newSwimlane, IEnumerable<CardPosition> boardCardEnumerable)
    {
        try { await _swimlaneRepository.AddSwimlaneAsync (newSwimlane); }
        catch (RequestFailedException reqFailedEx)
        {
            throw new RequestFailureWrapperException (nameof (Problem),
                                                      ErrorResponseMessages.AddToDatabaseErrorResponse (nameof (Swimlane), reqFailedEx.Status));
        }

        var swimlaneCollectionWithNewSwimlaneToUpdateOrder = await _swimlaneRepository.QuerySwimlanesAsync (swimlane => swimlane.SwimlaneOrder >= newSwimlane.SwimlaneOrder
                                                                                                    && swimlane.RowKey == newSwimlane.RowKey);
        try { _swimlaneRepository.IncrementExistingSwimlanesOrder (swimlaneCollectionWithNewSwimlaneToUpdateOrder, newSwimlane); }
        catch (ArgumentException argEx)
        {
            await RollbackEffectedEntitiesAndReturnErrorResponse<Swimlane> (argEx,
                                                                          swimlaneToDeleteOnFailure: newSwimlane,
                                                                          originalSwimlanesToRevertForFailure: swimlaneCollectionWithNewSwimlaneToUpdateOrder);
        }

        try { await _swimlaneRepository.FetchAndApplyNewOrderForEffectedBoardCardsAsync (swimlaneCollectionWithNewSwimlaneToUpdateOrder, boardCardEnumerable); }
        catch (RequestFailedException reqFailedEx)
        {
            await RollbackEffectedEntitiesAndReturnErrorResponse<CardPosition> (reqFailedEx,
                                                                             swimlaneToDeleteOnFailure: newSwimlane,
                                                                             originalSwimlanesToRevertForFailure: swimlaneCollectionWithNewSwimlaneToUpdateOrder,
                                                                             originalBoardCardsToRevertForFailure: boardCardEnumerable);
        }
    }

    /// <summary>
    /// 
    /// </summary>
    private async Task<Swimlane> UpdateSwimlaneAndUpdateEffectedSwimlanesAndBoardCards (Guid boardID,
                                                                            IEnumerable<Swimlane> swimlanesFromBoard,
                                                                            Swimlane swimlaneToUpdate,
                                                                            SwimlanePatchRequest convertedSwimlaneToUpdate,
                                                                            IEnumerable<Microsoft.AspNetCore.JsonPatch.Operations.Operation<SwimlanePatchRequest>> swimlanePatchRequest)
    {
        var orderIsUpdated = swimlanePatchRequest.Any (operation => string.Equals (operation.path, $"/{nameof (SwimlanePatchRequest.Order)}", StringComparison.OrdinalIgnoreCase));
        Collection<Swimlane>? otherSwimlanesWithUpdatedOrder = null;
        if (orderIsUpdated)
        {
            try { otherSwimlanesWithUpdatedOrder = await _swimlaneRepository.FetchAndApplyNewOrderForEffectedSwimlanesAsync (swimlaneToUpdate, convertedSwimlaneToUpdate.Order); }
            catch (RequestFailedException reqFailedEx)
            {
                await RollbackEffectedEntitiesAndReturnErrorResponse<Swimlane> (reqFailedEx,
                                                                              originalSwimlanesToRevertForFailure: swimlanesFromBoard);
            }
        }

        swimlaneToUpdate = _swimlaneMapper.MapSwimlanePatchRequestToSwimlane (convertedSwimlaneToUpdate); // Make sure that the response object is preserved if not mapped to.
        if (otherSwimlanesWithUpdatedOrder is not null)
            otherSwimlanesWithUpdatedOrder.Add (swimlaneToUpdate);
        var allUpdatedSwimlanes = otherSwimlanesWithUpdatedOrder ?? new Collection<Swimlane> { swimlaneToUpdate };

        Collection<CardPosition>? boardCardCollectionFromDatabase = null;
        try { boardCardCollectionFromDatabase = await _cardRepository.GetCardPositionsAsync (boardID); }
        catch (RequestFailedException reqFailedEx)
        {
            await RollbackEffectedEntitiesAndReturnErrorResponse<CardPosition> (reqFailedEx,
                                                                             originalSwimlanesToRevertForFailure: swimlanesFromBoard);
        }

        try { await _swimlaneRepository.FetchAndApplyNewOrderForEffectedBoardCardsAsync (allUpdatedSwimlanes, boardCardCollectionFromDatabase!); }
        catch (RequestFailedException reqFailedEx)
        {
            await RollbackEffectedEntitiesAndReturnErrorResponse<CardPosition> (reqFailedEx,
                                                                             originalSwimlanesToRevertForFailure: swimlanesFromBoard,
                                                                             originalBoardCardsToRevertForFailure: boardCardCollectionFromDatabase);
        }

        return swimlaneToUpdate;
    }

    /// <summary>
    /// Deletes the Swimlane passed in from the Board (ID) passed in. Then 
    /// performs the following steps:
    /// <list type="number">
    ///     <item>
    ///     Decrement any swimlanes that follow the deleted one.
    ///     </item>
    ///     <item>
    ///     Update the SwimlaneOrder field on all of the BoardCards associated 
    ///     with the decremented swimlanes.
    ///     </item>
    ///     <item>
    ///     Update the SwimlaneTitle field on all of the BoardCards associated 
    ///     with the deleted swimlane.
    ///     </item>
    /// </list>
    /// If any of these fail then there will be an attempt to roll back 
    /// effected swimlanes and cards.
    /// </summary>
    private async Task DeleteSwimlaneAndUpdateEffectedSwimlanesAndBoardCards (Guid boardID, Swimlane swimlaneToDelete)
    {
        try { await _swimlaneRepository.DeleteSwimlaneAsync (swimlaneToDelete); }
        catch (RequestFailedException reqFailedEx)
        {
            throw new RequestFailureWrapperException (nameof (Problem),
                                                      ErrorResponseMessages.RemoveFromDatabaseErrorResponse (nameof (Swimlane), reqFailedEx.Status));
        }

        var swimlanesToUpdateOrder = await _swimlaneRepository.QuerySwimlanesAsync (swimlane => swimlane.SwimlaneOrder > swimlaneToDelete.SwimlaneOrder
                                                                                        && swimlane.RowKey == swimlaneToDelete.RowKey);
        var swimlanesWithUpdatedOrder = _swimlaneRepository.DecrementExistingSwimlanesOrder (swimlanesToUpdateOrder);
        try { await _swimlaneRepository.UpdateSwimlaneBatchAsync (swimlanesWithUpdatedOrder!); }
        catch (TransactionFailedException transactionFailedEx)
        {
            await RollbackEffectedEntitiesAndReturnErrorResponse<Swimlane> (transactionFailedEx,
                                                                          swimlaneToAddOnFailure: swimlaneToDelete);
        }

        IEnumerable<CardPosition>? boardCardEnumerable = null;
        try
        {
            boardCardEnumerable = await _cardRepository.GetCardPositionsAsync (boardID);
            await _swimlaneRepository.FetchAndApplyNewOrderForEffectedBoardCardsAsync (swimlanesWithUpdatedOrder, boardCardEnumerable!);
        }
        catch (RequestFailedException reqFailedEx)
        {
            await RollbackEffectedEntitiesAndReturnErrorResponse<CardPosition> (reqFailedEx,
                                                                             swimlaneToAddOnFailure: swimlaneToDelete,
                                                                             originalSwimlanesToRevertForFailure: swimlanesToUpdateOrder);
        }

        try { await _swimlaneRepository.FetchAndApplyNewTitleForEffectedBoardCardsAsync (boardID, swimlaneToDelete); }
        catch (RequestFailedException reqFailedEx)
        {
            await RollbackEffectedEntitiesAndReturnErrorResponse<CardPosition> (reqFailedEx,
                                                                          swimlaneToAddOnFailure: swimlaneToDelete,
                                                                          originalSwimlanesToRevertForFailure: swimlanesToUpdateOrder,
                                                                          originalBoardCardsToRevertForFailure: boardCardEnumerable);
        }
    }

    /// <summary>
    /// Attempts to roll back any entity to the original version passed into 
    /// the method arguments. If that succeeds then a response exception is 
    /// thrown to indicate that something went wrong but a rollback occurred. 
    /// If the rollback fails then a response exception is thrown to indicate 
    /// that something went wrong and that the rollback also failed.
    /// </summary>
    private async Task RollbackEffectedEntitiesAndReturnErrorResponse<T> (Exception exception,
                                                                          IEnumerable<Swimlane>? originalSwimlanesToRevertForFailure = null,
                                                                          IEnumerable<CardPosition>? originalBoardCardsToRevertForFailure = null,
                                                                          Swimlane? swimlaneToAddOnFailure = null,
                                                                          Swimlane? swimlaneToDeleteOnFailure = null)
    {
        if (swimlaneToAddOnFailure is not null)
        {
            try { await _swimlaneRepository.AddSwimlaneAsync (swimlaneToAddOnFailure); }
            catch (RequestFailedException)
            {
                throw new RequestFailureWrapperException (nameof (Problem),
                                                          ErrorResponseMessages.UpdateEffectedEntitiesInDatabaseCatastrophicErrorResponse (nameof (Swimlane), exception.Message));
            }
        }

        if (swimlaneToDeleteOnFailure is not null)
        {
            try { await _swimlaneRepository.DeleteSwimlaneAsync (swimlaneToDeleteOnFailure); }
            catch (RequestFailedException)
            {
                throw new RequestFailureWrapperException (nameof (Problem),
                                                          ErrorResponseMessages.UpdateEffectedEntitiesInDatabaseCatastrophicErrorResponse (nameof (Swimlane), exception.Message));
            }
        }

        if (originalSwimlanesToRevertForFailure is not null
            && await _swimlaneRepository.TryRevertEffectedSwimlanesToOriginalAsync (originalSwimlanesToRevertForFailure))
            throw new RequestFailureWrapperException (nameof (Problem),
                                                      ErrorResponseMessages.UpdateEffectedEntitiesInDatabaseErrorResponse (nameof (Swimlane), exception.Message));

        if (originalBoardCardsToRevertForFailure is not null
            && await _swimlaneRepository.TryRevertEffectedBoardCardsToOriginalAsync (originalBoardCardsToRevertForFailure))
            throw new RequestFailureWrapperException (nameof (Problem),
                                                      ErrorResponseMessages.UpdateEffectedEntitiesInDatabaseErrorResponse (nameof (CardPosition), exception.Message));

        throw new RequestFailureWrapperException (nameof (Problem),
                                                  ErrorResponseMessages.UpdateEffectedEntitiesInDatabaseCatastrophicErrorResponse (typeof (T).Name, exception.Message));
    }
}