using ArcStrides.API.Exceptions;
using ArcStrides.API.Mappers;
using ArcStrides.API.Messages;
using ArcStrides.API.Models;
using ArcStrides.API.Models.Board;
using ArcStrides.API.Repositories;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using Azure;
using Azure.Data.Tables;
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

    private readonly SwimlaneMapper _swimlaneMapper;

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

    [HttpGet ("/arcstrides/boards/{boardID:guid}/swimlanes/{swimlaneID:guid}")]
    public async Task<ActionResult> FetchSwimlane (Guid boardID, Guid swimlaneID)
    {
        try
        {
            var swimlaneFromDatabase = await FetchAndValidateSwimlane (boardID, swimlaneID);

            var swimlaneResponse = _swimlaneMapper.MapSwimlaneToSwimlaneResponse (swimlaneFromDatabase);
            return Ok (swimlaneResponse);
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    [HttpPost ("/arcstrides/boards/{boardID:guid}/swimlanes")]
    public async Task<ActionResult> CreateBoardSwimlane ([FromRoute] Guid boardID,
                                                         [FromBody] SwimlaneCreateRequest swimlaneCreateRequest)
    {
        var validationResult = _swimlaneCreateRequestValidator.Validate (swimlaneCreateRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (SwimlaneCreateRequest), validationResult.ToString ()));

        try
        {
            var newSwimlane = _swimlaneMapper.MapSwimlaneCreateRequestToSwimlane (swimlaneCreateRequest);
            newSwimlane.PartitionKey = boardID.ToString ();
            newSwimlane.RowKey = Guid.NewGuid ().ToString ();

            await AddSwimlaneAndUpdateEffectedSwimlanesAndCardPositions (boardID, newSwimlane);

            var swimlaneResponse = _swimlaneMapper.MapSwimlaneToSwimlaneResponse (newSwimlane);
            return Created (default (Uri)/*Generate this later*/, swimlaneResponse);
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    [HttpPatch ("/arcstrides/boards/{boardID:Guid}/swimlanes/{swimlaneID:Guid}")]
    public async Task<ActionResult> UpdateBoardSwimlane ([FromRoute] Guid boardID,
                                                         [FromRoute] Guid swimlaneID,
                                                         [FromBody] JsonPatchDocument<SwimlanePatchRequest> swimlanePatchRequest)
    {
        var validationResult = _swimlanePatchRequestDocumentValidator.Validate (swimlanePatchRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (SwimlanePatchRequest), validationResult.ToString ()));

        try
        {
            var swimlanesFromDatabase = await FetchAndValidateAllExistingSwimlanesAsync (boardID);//Move into method
            var cardPositionsFromDatabase = await FetchAndValidateCardPositionsAsync (boardID);//Move into method

            var swimlaneToUpdate = swimlanesFromDatabase.FirstOrDefault (swimlane => swimlane.RowKey == swimlaneID.ToString ());
            if (swimlaneToUpdate is null)
                return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Swimlane)));

            var convertedSwimlaneToUpdate = _swimlaneMapper.MapSwimlaneToSwimlanePatchRequest (swimlaneToUpdate);
            try { swimlanePatchRequest.ApplyTo (convertedSwimlaneToUpdate); }
            catch (JsonPatchException)
                { return BadRequest (ErrorResponseMessages.PatchRequestIsInvalidErrorResponse (nameof (Swimlane))); }
            ValidateConvertedSwimlaneAgainstExistingSwimlanes (swimlaneToUpdate, convertedSwimlaneToUpdate, swimlanesFromDatabase);

            var updatedSwimlane = await UpdateSwimlaneAndUpdateEffectedSwimlanesAndCardPositions (boardID, swimlaneToUpdate, convertedSwimlaneToUpdate, swimlanesFromDatabase, cardPositionsFromDatabase, swimlanePatchRequest.Operations);

            var swimlaneResponse = _swimlaneMapper.MapSwimlaneToSwimlaneResponse (updatedSwimlane);
            return Ok (swimlaneResponse);
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    [HttpDelete ("/arcstrides/boards/{boardID:guid}/swimlanes/{swimlaneID:guid}")]
    public async Task<ActionResult> DeleteBoardSwimlane ([FromRoute] Guid boardID,
                                                         [FromRoute] Guid swimlaneID)
    {
        try
        {
            var swimlaneToDelete = await FetchAndValidateSwimlane (boardID, swimlaneID);

            await DeleteSwimlaneAndUpdateEffectedSwimlanesAndCardPositions (boardID, swimlaneToDelete);
            return Ok ();
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    /// <summary>
    /// Attempts to fetch a single swimlane based on its ID. If a single swimlane 
    /// is not returned then the request fails.
    /// </summary>
    private async Task<Swimlane> FetchAndValidateSwimlane (Guid boardID, Guid swimlaneID)
    {
        Swimlane? swimlaneFromDatabase = null;
        try { swimlaneFromDatabase = await _swimlaneRepository.GetSwimlaneAsync (boardID, swimlaneID); }
        catch (RequestFailedException reqFailedEx)
            { throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.FetchFromDatabaseErrorResponse (nameof (Swimlane), reqFailedEx.Status)); }

        if (swimlaneFromDatabase is null)
            throw new RequestFailureWrapperException (nameof (NotFound), ErrorResponseMessages.NotFoundErrorResponse (nameof (Swimlane)));

        return swimlaneFromDatabase!;
    }

    /// <summary>
    /// Attempts to fetch a collection of swimlanes that are all associated to 
    /// a board by that board's ID.
    /// </summary>
    private async Task<IEnumerable<Swimlane>> FetchAndValidateAllExistingSwimlanesAsync (Guid boardID)
    {
        try { return await _swimlaneRepository.GetAllBoardSwimlanes (boardID); }
        catch (RequestFailedException reqFailedEx)
            { throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.FetchFromDatabaseErrorResponse (nameof (Swimlane), reqFailedEx.Status)); }
    }

    /// <summary>
    /// Attempts to fetch a collection of board cards that are all all associated
    /// to a board by that board's ID.
    /// </summary>
    private async Task<IEnumerable<CardPosition>> FetchAndValidateCardPositionsAsync (Guid boardID)
    {
        IEnumerable<CardPosition>? boardCardEnumerableFromDatabase = null;
        try { boardCardEnumerableFromDatabase = await _cardRepository.GetCardPositionsAsync (boardID); }
        catch (RequestFailedException reqFailedEx)
            { throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.FetchFromDatabaseErrorResponse (nameof (CardPosition), reqFailedEx.Status)); }

        return boardCardEnumerableFromDatabase;
    }

    /// <summary>
    /// 
    /// </summary>
    private void ValidateConvertedSwimlaneAgainstExistingSwimlanes (Swimlane swimlaneToUpdate,
                                                                    SwimlanePatchRequest convertedSwimlaneToUpdate,
                                                                    IEnumerable<Swimlane> swimlanesFromBoard)
    {
        if (convertedSwimlaneToUpdate.Order is not 0 && convertedSwimlaneToUpdate.Order <= swimlanesFromBoard.Count ())
            throw new RequestFailureWrapperException (nameof (BadRequest), ErrorResponseMessages.ValidationFailedErrorResponse (nameof (Swimlane), ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (Swimlane.SwimlaneOrder))));

        var swimlanesWithoutSwimlaneToUpdate = DeepCopier.Copy (swimlanesFromBoard.ToList ());
        swimlanesWithoutSwimlaneToUpdate.Remove (swimlaneToUpdate);
        if (convertedSwimlaneToUpdate.Title is not null
            && swimlanesWithoutSwimlaneToUpdate.Any (swimlane => string.Equals (swimlane.Title, convertedSwimlaneToUpdate.Title, StringComparison.OrdinalIgnoreCase)))
            throw new RequestFailureWrapperException (nameof (BadRequest), ErrorResponseMessages.ValidationFailedErrorResponse (nameof (Swimlane), ValidatorMessages.DuplicateFieldValidatorMessage (nameof (Swimlane.Title))));
    }

    /// <summary>
    /// 
    /// </summary>
    private async Task AddSwimlaneAndUpdateEffectedSwimlanesAndCardPositions (Guid boardID,
                                                                              Swimlane newSwimlane)
    {
        var transaction = new TableTransactionAction (TableTransactionActionType.Add, newSwimlane);
        var createSwimlaneTransaction = new ArcTransaction ((transaction, newSwimlane));

        var swimlaneCollectionToUpdateOrder = await _swimlaneRepository.QuerySwimlanesAsync (swimlane => swimlane.SwimlaneOrder >= newSwimlane.SwimlaneOrder
                                                                                                         && swimlane.PartitionKey == newSwimlane.PartitionKey);
        createSwimlaneTransaction = _swimlaneRepository.IncrementExistingSwimlanesOrder (swimlaneCollectionToUpdateOrder, createSwimlaneTransaction);

        var cardPositionsFromBoard = await _cardRepository.GetCardPositionsAsync (boardID);
        var cardPositionCollectionToUpdateOrder = cardPositionsFromBoard.Where (cardPosition => cardPosition.SwimlaneOrder >= newSwimlane.SwimlaneOrder
                                                                                                && cardPosition.PartitionKey == newSwimlane.PartitionKey);
        createSwimlaneTransaction = _swimlaneRepository.ApplyNewOrderForExistingCardPositions (swimlaneCollectionToUpdateOrder, cardPositionCollectionToUpdateOrder, createSwimlaneTransaction);

        try { await _swimlaneRepository.SubmitArcTransactionAsync (createSwimlaneTransaction); }
        catch (RequestFailedException reqFailedEx)
            { throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.AddToDatabaseErrorResponse (nameof (Swimlane), reqFailedEx.Status)); }
    }

    private async Task<Swimlane> UpdateSwimlaneAndUpdateEffectedSwimlanesAndCardPositions (Guid boardID,
                                                                                           Swimlane swimlaneToUpdate,
                                                                                           SwimlanePatchRequest convertedSwimlaneToUpdate,
                                                                                           IEnumerable<Swimlane> swimlanesFromBoard,
                                                                                           IEnumerable<CardPosition> cardPositionsFromBoard,
                                                                                           IEnumerable<Microsoft.AspNetCore.JsonPatch.Operations.Operation<SwimlanePatchRequest>> swimlanePatchRequest)
    {
        var updateSwimlaneTransaction = new ArcTransaction ();

        var orderIsUpdated = swimlanePatchRequest.Any (operation => string.Equals (operation.path, $"/{nameof (SwimlanePatchRequest.Order)}", StringComparison.OrdinalIgnoreCase));
        if (orderIsUpdated)
            updateSwimlaneTransaction = _swimlaneRepository.ApplyNewOrderForExistingSwimlanes (swimlaneToUpdate, convertedSwimlaneToUpdate.Order.Value, swimlanesFromBoard, updateSwimlaneTransaction);

        swimlaneToUpdate = _swimlaneMapper.MapSwimlanePatchRequestToSwimlane (convertedSwimlaneToUpdate); // Make sure that the response object is preserved if not mapped to.

        var allUpdatedSwimlanes = updateSwimlaneTransaction.GetTransactionDictionary () [typeof (Swimlane).GetArcTableName ()]
                                                           .Select (action => (Swimlane) action.Entity)
                                                           .ToList ();
        allUpdatedSwimlanes.Add (swimlaneToUpdate);

        var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, swimlaneToUpdate);
        updateSwimlaneTransaction.Add (transaction, swimlaneToUpdate);

        updateSwimlaneTransaction = _swimlaneRepository.ApplyNewOrderForExistingCardPositions (allUpdatedSwimlanes!, cardPositionsFromBoard!, updateSwimlaneTransaction);

        try { await _swimlaneRepository.SubmitArcTransactionAsync (updateSwimlaneTransaction); }
        catch (RequestFailedException reqFailedEx)
            { throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.UpdateInDatabaseErrorResponse (nameof (Swimlane), reqFailedEx.Status)); }

        return swimlaneToUpdate;
    }

    private async Task DeleteSwimlaneAndUpdateEffectedSwimlanesAndCardPositions (Guid boardID,
                                                                                 Swimlane swimlaneToDelete)
    {
        var deleteSwimlaneTransaction = new ArcTransaction ();

        var swimlanesToUpdateOrder = await _swimlaneRepository.QuerySwimlanesAsync (swimlane => swimlane.SwimlaneOrder > swimlaneToDelete.SwimlaneOrder
                                                                                                && swimlane.PartitionKey == swimlaneToDelete.PartitionKey);
        deleteSwimlaneTransaction = _swimlaneRepository.DecrementExistingSwimlanesOrder (swimlanesToUpdateOrder, deleteSwimlaneTransaction);

        var allUpdatedSwimlanes = deleteSwimlaneTransaction.GetTransactionEntities<Swimlane> ().ToList ();
        var boardCardEnumerable = await _cardRepository.GetCardPositionsAsync (boardID);
        deleteSwimlaneTransaction = _swimlaneRepository.ApplyNewOrderForExistingCardPositions (allUpdatedSwimlanes, boardCardEnumerable, deleteSwimlaneTransaction);

        allUpdatedSwimlanes.Add (swimlaneToDelete);

        var transaction = new TableTransactionAction (TableTransactionActionType.Delete, swimlaneToDelete);
        deleteSwimlaneTransaction.Add (transaction, swimlaneToDelete);

        deleteSwimlaneTransaction = _swimlaneRepository.ApplyNewTitleAndOrderForExistingCardPositions (swimlaneToDelete, allUpdatedSwimlanes, boardCardEnumerable, deleteSwimlaneTransaction);

        try { await _swimlaneRepository.SubmitArcTransactionAsync (deleteSwimlaneTransaction); }
        catch (RequestFailedException reqFailedEx)
            { throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.RemoveFromDatabaseErrorResponse (nameof (Swimlane), reqFailedEx.Status)); }
    }
}