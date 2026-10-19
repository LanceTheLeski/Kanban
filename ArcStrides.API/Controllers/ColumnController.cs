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

using static ArcStrides.API.Validators.ColumnValidators;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Controllers;

[ApiController]
[Route ("arcstrides/columns")]
public class ColumnController : ArcController
{
    private readonly IValidator<ColumnCreateRequest> _columnCreateRequestValidator;
    private readonly IValidator<JsonPatchDocument<ColumnPatchRequest>> _columnPatchRequestDocumentValidator;

    private readonly ColumnMapper _columnMapper;

    private readonly IColumnRepository _columnRepository;
    private readonly ICardRepository _cardRepository;
    private readonly ITagRepository _tagRepository;

    public ColumnController (IColumnRepository columnRepository,
                             ICardRepository cardRepository,
                             ITagRepository tagRepository,
                             ColumnMapper columnMapper)
    {
        _columnCreateRequestValidator = new ColumnCreateRequestValidator ();
        _columnPatchRequestDocumentValidator = new ColumnPatchRequestDocumentValidator ();

        _columnMapper = columnMapper;

        _columnRepository = columnRepository;
        _cardRepository = cardRepository;
        _tagRepository = tagRepository;
    }

    [HttpGet ("/arcstrides/boards/{boardID:guid}/columns/{columnID:guid}")]
    public async Task<ActionResult> FetchColumn ([FromRoute] Guid boardID, 
                                                 [FromRoute] Guid columnID)
    {
        try
        {
            var columnFromDatabase = await FetchAndValidateColumn (boardID, columnID);

            var columnResponse = _columnMapper.MapColumnToColumnResponse (columnFromDatabase);
            return Ok (columnResponse);
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    /// <summary>
    /// Every column, on every board, that has a global colour — <c>GET arcstrides/columns/globalcolors</c>.
    /// </summary>
    /// <remarks>
    /// A global colour identifies a column across boards, so no two columns may
    /// share one. The create and edit overlays read this to say, before saving,
    /// that a colour is taken and by whom.
    /// </remarks>
    [HttpGet ("globalcolors")]
    public async Task<ActionResult> FetchGlobalColumnColors ()
    {
        try
        {
            var columnsWithGlobalColour = (await FetchAllColumnsAsync ()).Where (column => string.IsNullOrWhiteSpace (column.GlobalColumnColor) is false);

            var columnResponses = columnsWithGlobalColour.Select (_columnMapper.MapColumnToColumnResponse);
            return Ok (columnResponses);
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    [HttpPost ("/arcstrides/boards/{boardID:guid}/columns")]
    public async Task<ActionResult> CreateBoardColumn ([FromRoute] Guid boardID, 
                                                       [FromBody] ColumnCreateRequest columnCreateRequest)
    {
        var validationResult = _columnCreateRequestValidator.Validate (columnCreateRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (ColumnCreateRequest), validationResult.ToString ()));

        try
        {
            var newColumn = _columnMapper.MapColumnCreateRequestToColumn (columnCreateRequest);
            newColumn.PartitionKey = boardID.ToString ();
            newColumn.RowKey = Guid.NewGuid ().ToString ();

            await ValidateGlobalColourIsFreeAsync (newColumn.GlobalColumnColor, newColumn.RowKey);
            
            await AddColumnAndUpdateEffectedColumnsAndCardPositions (boardID, newColumn);

            var columnResponse = _columnMapper.MapColumnToColumnResponse (newColumn);
            return Created (default (Uri)/*Generate this later*/, columnResponse);
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    [HttpPatch ("/arcstrides/boards/{boardID:Guid}/columns/{columnID:Guid}")]
    public async Task<ActionResult> UpdateBoardColumn ([FromRoute] Guid boardID, 
                                                       [FromRoute] Guid columnID, 
                                                       [FromBody] JsonPatchDocument<ColumnPatchRequest> columnPatchRequest)
    {
        var validationResult = _columnPatchRequestDocumentValidator.Validate (columnPatchRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (ColumnPatchRequest), validationResult.ToString ()));

        try
        {
            var columnsFromDatabase = await FetchAndValidateAllExistingColumnsAsync (boardID);
            var cardPositionsFromDatabase = await FetchAndValidateCardPositionsAsync (boardID);

            var columnToUpdate = columnsFromDatabase.FirstOrDefault (column => column.RowKey == columnID.ToString ());
            if (columnToUpdate is null)
                return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Column)));

            var convertedColumnToUpdate = _columnMapper.MapColumnToColumnPatchRequest (columnToUpdate);
            try { columnPatchRequest.ApplyTo (convertedColumnToUpdate); }
            catch (JsonPatchException)
                { return BadRequest (ErrorResponseMessages.PatchRequestIsInvalidErrorResponse (nameof (Column))); }
            ValidateConvertedColumnAgainstExistingColumns (columnToUpdate, convertedColumnToUpdate, columnsFromDatabase);

            // Only when it changes: a column that already shares its global colour,
            // from before this was checked, can still be renamed or moved.
            if (string.Equals (convertedColumnToUpdate.GlobalColor?.Trim (), columnToUpdate.GlobalColumnColor?.Trim (), StringComparison.OrdinalIgnoreCase) is false)
                await ValidateGlobalColourIsFreeAsync (convertedColumnToUpdate.GlobalColor, columnToUpdate.RowKey);

            var updatedColumn = await UpdateColumnAndUpdateEffectedColumnsAndCardPositions (boardID, columnToUpdate, convertedColumnToUpdate, columnsFromDatabase, cardPositionsFromDatabase, columnPatchRequest.Operations);

            var columnResponse = _columnMapper.MapColumnToColumnResponse (updatedColumn);
            return Ok (columnResponse);
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    [HttpDelete ("/arcstrides/boards/{boardID:guid}/columns/{columnID:guid}")]
    public async Task<ActionResult> DeleteBoardColumn ([FromRoute] Guid boardID, 
                                                       [FromRoute] Guid columnID)
    {
        try
        {
            var columnToDelete = await FetchAndValidateColumn (boardID, columnID);

            await DeleteColumnAndUpdateEffectedColumnsAndCardPositions (boardID, columnToDelete);

            // Its tags come off with it; one left on nothing stays in the list of tags.
            await _tagRepository.DetachLabelsFromParentAsync (columnID);
            return Ok ();
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    /// <summary>
    /// Attempts to fetch a single column based on its ID. If a single column 
    /// is not returned then the request fails.
    /// </summary>
    private async Task<Column> FetchAndValidateColumn (Guid boardID, Guid columnID)
    {
        Column? columnFromDatabase = null;
        try { columnFromDatabase = await _columnRepository.GetColumnAsync (boardID, columnID); }
        catch (RequestFailedException reqFailedEx)
            { throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.FetchFromDatabaseErrorResponse (nameof (Column), reqFailedEx.Status)); }

        if (columnFromDatabase is null)
            throw new RequestFailureWrapperException (nameof (NotFound), ErrorResponseMessages.NotFoundErrorResponse (nameof (Column)));

        return columnFromDatabase!;
    }

    /// <summary>
    /// Attempts to fetch a collection of columns that are all associated to 
    /// a board by that board's ID.
    /// </summary>
    private async Task<IEnumerable<Column>> FetchAndValidateAllExistingColumnsAsync (Guid boardID)
    {
        try { return await _columnRepository.GetAllBoardColumnsAsync (boardID); }
        catch (RequestFailedException reqFailedEx)
            { throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.FetchFromDatabaseErrorResponse (nameof (Column), reqFailedEx.Status)); }
    }

    /// <summary>
    /// Every column on every board.
    /// </summary>
    private async Task<IEnumerable<Column>> FetchAllColumnsAsync ()
    {
        try { return await _columnRepository.QueryColumnsAsync (column => true); }
        catch (RequestFailedException reqFailedEx)
            { throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.FetchFromDatabaseErrorResponse (nameof (Column), reqFailedEx.Status)); }
    }

    /// <summary>
    /// Refuses a global colour that another column, on any board, already has.
    /// </summary>
    /// <remarks>
    /// Compared without case or surrounding space, so "#AABBCC" and "#aabbcc" are
    /// the same colour. No colour is never taken. Swimlanes are not looked at: a
    /// column and a swimlane may share a global colour.
    /// </remarks>
    private async Task ValidateGlobalColourIsFreeAsync (string? globalColour, string? columnID)
    {
        if (string.IsNullOrWhiteSpace (globalColour))
            return;

        var takenBy = (await FetchAllColumnsAsync ()).FirstOrDefault (column => column.RowKey != columnID
                                                                                && string.Equals (column.GlobalColumnColor?.Trim (), globalColour.Trim (), StringComparison.OrdinalIgnoreCase));
        if (takenBy is not null)
            throw new RequestFailureWrapperException (nameof (BadRequest), ErrorResponseMessages.GlobalColourTakenErrorResponse ("column", globalColour.Trim (), $"\"{takenBy.Title}\""));
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
    /// Validates that the fields on the converted column are valid. Specifically 
    /// that the order is in bounds of the board column total and that the new 
    /// column Title does not conflict with an existing one.
    /// </summary>
    private void ValidateConvertedColumnAgainstExistingColumns (Column columnToUpdate, 
                                                                ColumnPatchRequest convertedColumnToUpdate, 
                                                                IEnumerable<Column> columnsFromBoard)
    {
        if (convertedColumnToUpdate.Order < 0 
            || convertedColumnToUpdate.Order >= columnsFromBoard.Count ())
            throw new RequestFailureWrapperException (nameof (BadRequest), ErrorResponseMessages.ValidationFailedErrorResponse (nameof (Column), ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (Column.ColumnOrder))));

        var columnsWithoutColumnToUpdate = DeepCopier.Copy (columnsFromBoard.ToList ());
        columnsWithoutColumnToUpdate.RemoveAll (column => column.RowKey == columnToUpdate.RowKey);
        if (convertedColumnToUpdate.Title is not null 
            && columnsWithoutColumnToUpdate.Any (column => string.Equals (column.Title, convertedColumnToUpdate.Title, StringComparison.OrdinalIgnoreCase)))
            throw new RequestFailureWrapperException (nameof (BadRequest), ErrorResponseMessages.ValidationFailedErrorResponse (nameof (Column), ValidatorMessages.DuplicateFieldValidatorMessage (nameof (Column.Title))));
    }

    /// <summary>
    /// Executes a transaction to:
    /// <list type="bullet">
    ///     <item>Add the new column.</item>
    ///     <item>Increment the columns that follow the new column's order on the board.</item>
    ///     <item>Update any effected card positions due to a column being moved.</item>
    /// </list>
    /// </summary>
    private async Task AddColumnAndUpdateEffectedColumnsAndCardPositions (Guid boardID, 
                                                                          Column newColumn)
    {
        var transaction = new TableTransactionAction (TableTransactionActionType.Add, newColumn);
        var createColumnTransaction = new ArcTransaction ((transaction, newColumn));

        var columnCollectionToUpdateOrder = await _columnRepository.QueryColumnsAsync (column => column.ColumnOrder >= newColumn.ColumnOrder
                                                                                                 && column.PartitionKey == newColumn.PartitionKey);
        createColumnTransaction = _columnRepository.IncrementExistingColumnsOrder (columnCollectionToUpdateOrder, createColumnTransaction);
        var columnsWithUpdatedOrder = createColumnTransaction.GetTransactionDictionary () [typeof (Column).GetArcTableName ()!]
                                                             .Select (transactionAction => (Column) transactionAction.Entity);

        var cardPositionsFromBoard = await _cardRepository.GetCardPositionsAsync (boardID);
        var cardPositionCollectionToUpdateOrder = cardPositionsFromBoard.Where (cardPosition => cardPosition.ColumnOrder >= newColumn.ColumnOrder
                                                                                                && cardPosition.PartitionKey == newColumn.PartitionKey);
        createColumnTransaction = _columnRepository.ApplyNewOrderForExistingCardPositions (columnsWithUpdatedOrder, cardPositionCollectionToUpdateOrder, createColumnTransaction);

        try { await _columnRepository.SubmitArcTransactionAsync (createColumnTransaction); }
        catch (RequestFailedException reqFailedEx)
            { throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.AddToDatabaseErrorResponse (nameof (Column), reqFailedEx.Status)); }
    }

    /// <summary>
    /// Executes a transaction to:
    /// <list type="bullet">
    ///     <item>Update any effected column order due to the chosen column moving.</item>
    ///     <item>Update the chosen column.</item>
    ///     <item>Update any effected card positions due to a column being moved.</item>
    /// </list>
    /// </summary>
    private async Task<Column> UpdateColumnAndUpdateEffectedColumnsAndCardPositions (Guid boardID,
                                                                                     Column columnToUpdate,
                                                                                     ColumnPatchRequest convertedColumnPatchRequest,
                                                                                     IEnumerable<Column> columnsFromBoard,
                                                                                     IEnumerable<CardPosition> cardPositionsFromBoard,
                                                                                     IEnumerable<Microsoft.AspNetCore.JsonPatch.SystemTextJson.Operations.Operation<ColumnPatchRequest>> columnPatchRequest)
    {
        var updateColumnTransaction = new ArcTransaction ();

        var orderIsUpdated = columnPatchRequest.Any (operation => string.Equals (operation.path, $"/{nameof (ColumnPatchRequest.Order)}", StringComparison.OrdinalIgnoreCase));
        if (orderIsUpdated)
            updateColumnTransaction = _columnRepository.ApplyNewOrderForExistingColumns (columnToUpdate, convertedColumnPatchRequest.Order.Value, columnsFromBoard, updateColumnTransaction);

        var originalColumn = DeepCopier.Copy (columnToUpdate);
        var convertedColumnToUpdate = _columnMapper.MapColumnPatchRequestToColumn (convertedColumnPatchRequest); // Make sure that the response object is preserved if not mapped to.
        _columnMapper.MapFieldsFromSourceToTarget (convertedColumnToUpdate, columnToUpdate);

        var allUpdatedColumns = updateColumnTransaction.GetTransactionEntities<Column> ().ToList ();
        allUpdatedColumns.Add (columnToUpdate);

        var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, columnToUpdate);
        updateColumnTransaction.Add (transaction, originalColumn);

        updateColumnTransaction = _columnRepository.ApplyNewOrderForExistingCardPositions (allUpdatedColumns!, cardPositionsFromBoard!, updateColumnTransaction);

        try { await _columnRepository.SubmitArcTransactionAsync (updateColumnTransaction); }
        catch (RequestFailedException reqFailedEx)
            { throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.UpdateInDatabaseErrorResponse (nameof (Column), reqFailedEx.Status)); }

        return columnToUpdate;
    }

    /// <summary>
    /// Executes a transaction to:
    /// <list type="bullet">
    ///     <item>Decrement any effected column order due to the removed column.</item>    
    ///     <item>Update any effected card positions order due to a column being moved.</item>
    ///     <item>Move the deleted column's cards into the column that takes its place.</item>
    /// </list>
    /// The last column cannot be deleted while it holds cards: a card is always in
    /// a column. The UI offers to make an "Orphaned" column for them first.
    /// </summary>
    private async Task DeleteColumnAndUpdateEffectedColumnsAndCardPositions (Guid boardID,
                                                                             Column columnToDelete)
    {
        var deleteColumnTransaction = new ArcTransaction ();

        // Every column on the board, read once, so the ones renumbered below are the
        // same instances the cards are moved between -- see the swimlane delete.
        var boardColumns = await FetchAndValidateAllExistingColumnsAsync (boardID);
        var remainingColumns = boardColumns.Where (column => column.RowKey != columnToDelete.RowKey)
                                           .ToList ();

        var boardCardEnumerable = await _cardRepository.GetCardPositionsAsync (boardID);
        var cardsInColumn = boardCardEnumerable.Any (cardPosition => string.Equals (cardPosition.ColumnID.ToString (), columnToDelete.RowKey, StringComparison.OrdinalIgnoreCase));
        if (remainingColumns.Count is 0 && cardsInColumn)
            throw new RequestFailureWrapperException (nameof (BadRequest), ErrorResponseMessages.LastColumnHoldsCardsErrorResponse ());

        var columnsToUpdateOrder = remainingColumns.Where (column => column.ColumnOrder > columnToDelete.ColumnOrder)
                                                   .ToList ();
        deleteColumnTransaction = _columnRepository.DecrementExistingColumnsOrder (columnsToUpdateOrder, deleteColumnTransaction);
        var allUpdatedColumns = deleteColumnTransaction.GetTransactionEntities<Column> ().ToList ();

        deleteColumnTransaction = _columnRepository.ApplyNewOrderForExistingCardPositions (allUpdatedColumns, boardCardEnumerable, deleteColumnTransaction);

        var transaction = new TableTransactionAction (TableTransactionActionType.Delete, columnToDelete);
        deleteColumnTransaction.Add (transaction, columnToDelete);

        deleteColumnTransaction = _columnRepository.ApplyNewTitleAndOrderForExistingCardPositions (columnToDelete, remainingColumns, boardCardEnumerable, deleteColumnTransaction);

        try { await _columnRepository.SubmitArcTransactionAsync (deleteColumnTransaction); }
        catch (RequestFailedException reqFailedEx)
            { throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.RemoveFromDatabaseErrorResponse (nameof (Column), reqFailedEx.Status)); }
    }
}