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

using static ArcStrides.API.Validators.ColumnValidators;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Controllers;

[ApiController]
[Route ("arcstrides/columns")]
public class ColumnController : ArcController
{
    private readonly IValidator<ColumnCreateRequest> _columnCreateRequestValidator;
    private readonly IValidator<JsonPatchDocument<ColumnPatchRequest>> _columnPatchRequestDocumentValidator;

    private readonly IColumnMapper _columnMapper;

    private readonly IColumnRepository _columnRepository;
    private readonly ICardRepository _cardRepository;

    public ColumnController (IColumnRepository columnRepository,
                             ICardRepository cardRepository)
    {
        _columnCreateRequestValidator = new ColumnCreateRequestValidator ();
        _columnPatchRequestDocumentValidator = new ColumnPatchRequestDocumentValidator ();

        _columnMapper = new ColumnMapper ();

        _columnRepository = columnRepository;
        _cardRepository = cardRepository;
    }

    [HttpGet ("/arcstrides/boards/{boardID:guid}/columns/{columnID:guid}")]
    public async Task<ActionResult> FetchColumn (Guid boardID, Guid columnID)
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
            var columnsFromDatabase = await FetchAndValidateAllExistingColumnsAsync (boardID);//Move into method
            var cardPositionsFromDatabase = await FetchAndValidateCardPositionsAsync (boardID);//Move into method

            var columnToUpdate = columnsFromDatabase.FirstOrDefault (column => column.RowKey == columnID.ToString ());
            if (columnToUpdate is null)
                return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Column)));

            var convertedColumnToUpdate = _columnMapper.MapColumnToColumnPatchRequest (columnToUpdate);
            try { columnPatchRequest.ApplyTo (convertedColumnToUpdate); }
            catch (JsonPatchException)
                { return BadRequest (ErrorResponseMessages.PatchRequestIsInvalidErrorResponse (nameof (Column))); }
            ValidateConvertedColumnAgainstExistingColumns (columnToUpdate, convertedColumnToUpdate, columnsFromDatabase);

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
        try { return await _columnRepository.GetAllBoardColumns (boardID); }
        catch (RequestFailedException reqFailedEx)
            { throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.FetchFromDatabaseErrorResponse (nameof (Column), reqFailedEx.Status)); }
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
    private void ValidateConvertedColumnAgainstExistingColumns (Column columnToUpdate, 
                                                                ColumnPatchRequest convertedColumnToUpdate, 
                                                                IEnumerable<Column> columnsFromBoard)
    {
        if (convertedColumnToUpdate.Order is not 0 && convertedColumnToUpdate.Order <= columnsFromBoard.Count ())
            throw new RequestFailureWrapperException (nameof (BadRequest), ErrorResponseMessages.ValidationFailedErrorResponse (nameof (Column), ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (Column.ColumnOrder))));

        var columnsWithoutColumnToUpdate = DeepCopier.Copy (columnsFromBoard.ToList ());
        columnsWithoutColumnToUpdate.Remove (columnToUpdate);
        if (convertedColumnToUpdate.Title is not null 
            && columnsWithoutColumnToUpdate.Any (column => string.Equals (column.Title, convertedColumnToUpdate.Title, StringComparison.OrdinalIgnoreCase)))
            throw new RequestFailureWrapperException (nameof (BadRequest), ErrorResponseMessages.ValidationFailedErrorResponse (nameof (Column), ValidatorMessages.DuplicateFieldValidatorMessage (nameof (Column.Title))));
    }

    /// <summary>
    /// 
    /// </summary>
    private async Task AddColumnAndUpdateEffectedColumnsAndCardPositions (Guid boardID, 
                                                                          Column newColumn)
    {
        var transaction = new TableTransactionAction (TableTransactionActionType.Add, newColumn);
        var createColumnTransaction = new ArcTransaction ((transaction, newColumn));

        var columnCollectionToUpdateOrder = await _columnRepository.QueryColumnsAsync (column => column.ColumnOrder >= newColumn.ColumnOrder
                                                                                                 && column.PartitionKey == newColumn.PartitionKey);
        createColumnTransaction = _columnRepository.IncrementExistingColumnsOrder (columnCollectionToUpdateOrder, createColumnTransaction);

        var cardPositionsFromBoard = await _cardRepository.GetCardPositionsAsync (boardID);
        var cardPositionCollectionToUpdateOrder = cardPositionsFromBoard.Where (cardPosition => cardPosition.ColumnOrder >= newColumn.ColumnOrder
                                                                                                && cardPosition.PartitionKey == newColumn.PartitionKey);
        createColumnTransaction = _columnRepository.ApplyNewOrderForExistingCardPositions (columnCollectionToUpdateOrder, cardPositionCollectionToUpdateOrder, createColumnTransaction);

        try { await _columnRepository.SubmitArcTransactionAsync (createColumnTransaction); }
        catch (RequestFailedException reqFailedEx)
            { throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.AddToDatabaseErrorResponse (nameof (Column), reqFailedEx.Status)); }
    }

    private async Task<Column> UpdateColumnAndUpdateEffectedColumnsAndCardPositions (Guid boardID,
                                                                                     Column columnToUpdate,
                                                                                     ColumnPatchRequest convertedColumnToUpdate,
                                                                                     IEnumerable<Column> columnsFromBoard,
                                                                                     IEnumerable<CardPosition> cardPositionsFromBoard,
                                                                                     IEnumerable<Microsoft.AspNetCore.JsonPatch.Operations.Operation<ColumnPatchRequest>> columnPatchRequest)
    {
        var updateColumnTransaction = new ArcTransaction ();

        var orderIsUpdated = columnPatchRequest.Any (operation => string.Equals (operation.path, $"/{nameof (ColumnPatchRequest.Order)}", StringComparison.OrdinalIgnoreCase));
        if (orderIsUpdated)
            updateColumnTransaction = _columnRepository.ApplyNewOrderForExistingColumns (columnToUpdate, convertedColumnToUpdate.Order.Value, columnsFromBoard, updateColumnTransaction);

        columnToUpdate = _columnMapper.MapColumnPatchRequestToColumn (convertedColumnToUpdate); // Make sure that the response object is preserved if not mapped to.

        var allUpdatedColumns = updateColumnTransaction.GetTransactionDictionary () [typeof(Column).GetArcTableName ()]
                                                       .Select (action => (Column) action.Entity)
                                                       .ToList ();
        allUpdatedColumns.Add (columnToUpdate);

        var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, columnToUpdate);
        updateColumnTransaction.Add (transaction, columnToUpdate);

        updateColumnTransaction = _columnRepository.ApplyNewOrderForExistingCardPositions (allUpdatedColumns!, cardPositionsFromBoard!, updateColumnTransaction);

        try { await _columnRepository.SubmitArcTransactionAsync (updateColumnTransaction); }
        catch (RequestFailedException reqFailedEx)
            { throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.UpdateInDatabaseErrorResponse (nameof (Column), reqFailedEx.Status)); }

        return columnToUpdate;
    }

    private async Task DeleteColumnAndUpdateEffectedColumnsAndCardPositions (Guid boardID,
                                                                             Column columnToDelete)
    {
        var deleteColumnTransaction = new ArcTransaction ();

        var columnsToUpdateOrder = await _columnRepository.QueryColumnsAsync (column => column.ColumnOrder > columnToDelete.ColumnOrder
                                                                                        && column.PartitionKey == columnToDelete.PartitionKey);
        deleteColumnTransaction = _columnRepository.DecrementExistingColumnsOrder (columnsToUpdateOrder, deleteColumnTransaction);

        var allUpdatedColumns = deleteColumnTransaction.GetTransactionDictionary () [typeof (Column).GetArcTableName ()]
                                                       .Select (action => (Column) action.Entity)
                                                       .ToList ();
        var boardCardEnumerable = await _cardRepository.GetCardPositionsAsync (boardID);
        deleteColumnTransaction = _columnRepository.ApplyNewOrderForExistingCardPositions (allUpdatedColumns, boardCardEnumerable, deleteColumnTransaction);

        allUpdatedColumns.Add (columnToDelete);

        var transaction = new TableTransactionAction (TableTransactionActionType.Delete, columnToDelete);
        deleteColumnTransaction.Add (transaction, columnToDelete);

        deleteColumnTransaction = _columnRepository.ApplyNewTitleAndOrderForExistingCardPositions (columnToDelete, allUpdatedColumns, boardCardEnumerable, deleteColumnTransaction);

        try { await _columnRepository.SubmitArcTransactionAsync (deleteColumnTransaction); }
        catch (RequestFailedException reqFailedEx)
            { throw new RequestFailureWrapperException (nameof (Problem), ErrorResponseMessages.RemoveFromDatabaseErrorResponse (nameof (Column), reqFailedEx.Status)); }
    }
}