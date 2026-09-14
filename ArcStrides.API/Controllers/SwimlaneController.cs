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
using Microsoft.AspNetCore.JsonPatch.SystemTextJson;
using Microsoft.AspNetCore.JsonPatch.SystemTextJson.Exceptions;
using Microsoft.AspNetCore.Mvc;

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
    public async Task<ActionResult> FetchSwimlane ([FromRoute] Guid boardID, 
                                                   [FromRoute] Guid swimlaneID)
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
        // A swimlane may move to any slot the board has: 0 through count - 1.
        //
        // The test used to be `Order is not 0 && Order <= Count()`, which rejects
        // every position that exists except 0 -- moving a swimlane to position 1 on
        // a two-swimlane board failed as "out of range", while position 5 on that
        // same board passed.
        if (convertedSwimlaneToUpdate.Order is int newSwimlaneOrder
            && (newSwimlaneOrder < 0 || newSwimlaneOrder >= swimlanesFromBoard.Count ()))
            throw new RequestFailureWrapperException (nameof (BadRequest), ErrorResponseMessages.ValidationFailedErrorResponse (nameof (Swimlane), ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (Swimlane.SwimlaneOrder))));

        // Compare the new title against the *other* swimlanes, matched by ID.
        //
        // This used to deep-copy the list and then Remove(swimlaneToUpdate), which
        // removes by reference -- and after a copy there is no reference to match,
        // so nothing was removed and the swimlane was compared against itself. Any
        // patch that left the title as it was reported a duplicate title.
        var otherSwimlanes = swimlanesFromBoard.Where (swimlane => swimlane.RowKey != swimlaneToUpdate.RowKey);
        if (convertedSwimlaneToUpdate.Title is not null
            && otherSwimlanes.Any (swimlane => string.Equals (swimlane.Title, convertedSwimlaneToUpdate.Title, StringComparison.OrdinalIgnoreCase)))
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

        bool submitted;
        try { submitted = await _swimlaneRepository.SubmitArcTransactionAsync (createSwimlaneTransaction); }
        catch (RequestFailedException reqFailedEx)
            { throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.AddToDatabaseErrorResponse (nameof (Swimlane), reqFailedEx.Status)); }

        // false means the write failed and was rolled back. Discarding it -- which
        // every call site did -- reported 201 Created for a swimlane that was never
        // stored, and left the caller believing a board it had not changed.
        if (submitted is false)
            throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.AddToDatabaseErrorResponse (nameof (Swimlane), StatusCodes.Status409Conflict));
    }

    private async Task<Swimlane> UpdateSwimlaneAndUpdateEffectedSwimlanesAndCardPositions (Guid boardID,
                                                                                           Swimlane swimlaneToUpdate,
                                                                                           SwimlanePatchRequest convertedSwimlaneToUpdate,
                                                                                           IEnumerable<Swimlane> swimlanesFromBoard,
                                                                                           IEnumerable<CardPosition> cardPositionsFromBoard,
                                                                                           IEnumerable<Microsoft.AspNetCore.JsonPatch.SystemTextJson.Operations.Operation<SwimlanePatchRequest>> swimlanePatchRequest)
    {
        var updateSwimlaneTransaction = new ArcTransaction ();

        var orderIsUpdated = swimlanePatchRequest.Any (operation => string.Equals (operation.path, $"/{nameof (SwimlanePatchRequest.Order)}", StringComparison.OrdinalIgnoreCase));
        // `is int` rather than .Value: an Order operation carrying null would
        // otherwise throw from here as a generic 500 instead of being ignored.
        if (orderIsUpdated && convertedSwimlaneToUpdate.Order is int patchedSwimlaneOrder)
            updateSwimlaneTransaction = _swimlaneRepository.ApplyNewOrderForExistingSwimlanes (swimlaneToUpdate, patchedSwimlaneOrder, swimlanesFromBoard, updateSwimlaneTransaction);

        // Merge the patch onto the stored swimlane rather than replacing it.
        //
        // This used to reassign swimlaneToUpdate to a Swimlane built from the patch
        // request, which carries only Title and Order -- so the entity handed to the
        // transaction had a null RowKey and a null PartitionKey. Adding it hit
        // Guid.Parse(null) in ArcTransactionCollection and threw, which the
        // controller turned into "An error occurred while processing your request"
        // with nothing in the log. ColumnController has always done it this way.
        var originalSwimlane = DeepCopier.Copy (swimlaneToUpdate);

        // Assigned by hand rather than through the mapper, which is how the column
        // path does it -- and which does not work here.
        //
        // ColumnMapper's merge is safe because Column.RowKey is `string?`, so
        // AllowNullPropertyAssignment = false makes Mapperly emit a null check and
        // the key survives. Swimlane.RowKey is `string`, non-nullable, so there is
        // no null for Mapperly to guard against and it assigns straight over the
        // top: the merge wrote null into the row's own identity, and adding it to
        // the transaction failed on "The given entities do not have a matching
        // RowKey".
        //
        // A SwimlanePatchRequest has exactly two fields. Copying them explicitly is
        // shorter than the mapper call it replaces and cannot be undone by a change
        // in generated behaviour. Identity is not patchable and is never touched.
        if (convertedSwimlaneToUpdate.Title is not null)
            swimlaneToUpdate.Title = convertedSwimlaneToUpdate.Title;

        if (convertedSwimlaneToUpdate.Order is int patchedOrder)
            swimlaneToUpdate.SwimlaneOrder = patchedOrder;

        // GetTransactionEntities rather than indexing the dictionary: the indexer
        // throws KeyNotFoundException when no swimlane order changed, so a patch that
        // only renamed a swimlane failed here for a second, unrelated reason.
        var allUpdatedSwimlanes = updateSwimlaneTransaction.GetTransactionEntities<Swimlane> ().ToList ();
        allUpdatedSwimlanes.Add (swimlaneToUpdate);

        var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, swimlaneToUpdate);
        // The snapshot taken above, not the entity that was just modified -- the
        // second argument is what a rollback restores.
        updateSwimlaneTransaction.Add (transaction, originalSwimlane);

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