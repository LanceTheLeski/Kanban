using ArcStrides.API.Exceptions;
using ArcStrides.API.Mappers;
using ArcStrides.API.Messages;
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

    [HttpGet ("{ID:guid}")]
    public async Task<ActionResult> FetchColumn (Guid ID)
    {
        try
        {
            var columnFromDatabase = await FetchAndValidateColumn (ID);

            var columnResponse = _columnMapper.MapColumnToColumnResponse (columnFromDatabase);
            return Ok (columnResponse);
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    [HttpPost ("/arcstrides/boards/{boardID:guid}/columns")]
    public async Task<ActionResult> CreateBoardColumn ([FromRoute] Guid boardID, [FromBody] ColumnCreateRequest columnCreateRequest)
    {
        var validationResult = _columnCreateRequestValidator.Validate (columnCreateRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (ColumnCreateRequest), validationResult.ToString ()));

        try
        {
            var boardCardEnumerableFromDatabase = await FetchAndValidateBoardCardsAsync (boardID);

            var newColumn = _columnMapper.MapColumnCreateRequestToColumn (columnCreateRequest);
            newColumn.PartitionKey = boardID.ToString ();
            newColumn.RowKey = Guid.NewGuid ().ToString ();
            
            await AddColumnAndUpdateEffectedColumnsAndCardPositions (boardID, newColumn, boardCardEnumerableFromDatabase);

            var columnResponse = _columnMapper.MapColumnToColumnResponse (newColumn);
            return Created (default (Uri)/*Generate this later*/, columnResponse);
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    [HttpPatch ("/arcstrides/boards/{boardID:Guid}/columns/{columnID:Guid}")]
    public async Task<ActionResult> UpdateBoardColumn (Guid boardID, Guid columnID, [FromBody] JsonPatchDocument<ColumnPatchRequest> columnPatchRequest)
    {
        var validationResult = _columnPatchRequestDocumentValidator.Validate (columnPatchRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (ColumnPatchRequest), validationResult.ToString ()));

        try
        {
            var columnsFromBoard = await FetchAndValidateAllExistingColumnsAsync (boardID);

            var columnToUpdate = columnsFromBoard.FirstOrDefault (column => column.PartitionKey == columnID.ToString ());
            if (columnToUpdate is null)
                return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Column)));

            var convertedColumnToUpdate = _columnMapper.MapColumnToColumnPatchRequest (columnToUpdate);
            try { columnPatchRequest.ApplyTo (convertedColumnToUpdate); }
            catch (JsonPatchException)
                { return BadRequest (ErrorResponseMessages.PatchRequestIsInvalidErrorResponse (nameof (Column))); }
            ValidateConvertedColumnAgainstExistingColumns (columnToUpdate, convertedColumnToUpdate, columnsFromBoard);

            var updatedColumn = await UpdateColumnAndUpdateEffectedColumnsAndCardPositions (boardID, columnsFromBoard, columnToUpdate, convertedColumnToUpdate, columnPatchRequest.Operations);

            var columnResponse = _columnMapper.MapColumnToColumnResponse (updatedColumn);
            return Ok (columnResponse);
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    [HttpDelete ("/arcstrides/boards/{boardID:guid}/columns/{columnID:guid}")]
    public async Task<ActionResult> DeleteBoardColumn (Guid boardID, Guid columnID)
    {
        try
        {
            var columnToDelete = await FetchAndValidateColumn (columnID);

            await DeleteColumnAndUpdateEffectedColumnsAndBoardCards (boardID, columnToDelete);
            return Ok ();
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    /// <summary>
    /// Attempts to fetch a single column based on its ID. If a single column 
    /// is not returned then the request fails.
    /// </summary>
    private async Task<Column> FetchAndValidateColumn (Guid columnID)
    {
        IEnumerable<Column>? columnEnumerableFromDatabase = null;
        try { await _columnRepository.GetColumnsAsync (columnID); }
        catch (RequestFailedException reqFailedEx)
        { 
            throw new RequestFailureWrapperException (nameof (Problem), 
                                                      ErrorResponseMessages.FetchFromDatabaseErrorResponse (nameof (Column), reqFailedEx.Status)); 
        }

        if (columnEnumerableFromDatabase!.Count () is 0)
            throw new RequestFailureWrapperException (nameof (NotFound),
                                                      ErrorResponseMessages.NotFoundErrorResponse (nameof (Column)));
        if (columnEnumerableFromDatabase!.Count () is not 1)
            throw new RequestFailureWrapperException (nameof (Problem),
                                                      ErrorResponseMessages.TooManyEntitiesErrorResponse (nameof (Column)));

        return columnEnumerableFromDatabase!.Single ();
    }

    /// <summary>
    /// Attempts to fetch a collection of columns that are all associated to 
    /// a board by that board's ID.
    /// </summary>
    private async Task<IEnumerable<Column>> FetchAndValidateAllExistingColumnsAsync (Guid boardID)
    {
        try { return await _columnRepository.GetAllBoardColumns (boardID); }
        catch (RequestFailedException reqFailedEx)
        {
            throw new RequestFailureWrapperException (nameof (Problem),
                                                      ErrorResponseMessages.FetchFromDatabaseErrorResponse (nameof (Column), reqFailedEx.Status));
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
    private void ValidateConvertedColumnAgainstExistingColumns (Column columnToUpdate, ColumnPatchRequest convertedColumnToUpdate, IEnumerable<Column> columnsFromBoard)
    {
        if (convertedColumnToUpdate.Order is not 0
            && convertedColumnToUpdate.Order <= columnsFromBoard.Count ())
            throw new RequestFailureWrapperException (nameof (BadRequest), 
                                                      ErrorResponseMessages.ValidationFailedErrorResponse (nameof (Column), ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (Column.ColumnOrder))));

        var columnsWithoutColumnToUpdate = DeepCopier.Copy (columnsFromBoard.ToList ());
        columnsWithoutColumnToUpdate.Remove (columnToUpdate);
        if (convertedColumnToUpdate.Title is not null
            && columnsWithoutColumnToUpdate.Any (column => string.Equals (column.Title, convertedColumnToUpdate.Title, StringComparison.OrdinalIgnoreCase)))
            throw new RequestFailureWrapperException (nameof (BadRequest), 
                                                      ErrorResponseMessages.ValidationFailedErrorResponse (nameof (Column), ValidatorMessages.DuplicateFieldValidatorMessage (nameof (Column.Title))));
    }

    /// <summary>
    /// 
    /// </summary>
    private async Task AddColumnAndUpdateEffectedColumnsAndCardPositions (Guid boardID, Column newColumn, IEnumerable<CardPosition> boardCardEnumerable)
    {
        var createColumnTransaction = new ArcTransaction (Guid.Parse (newColumn.PartitionKey), 
                                                          new TableTransactionAction (TableTransactionActionType.Add, newColumn));

        var columnCollectionToUpdateOrder = await _columnRepository.QueryColumnsAsync (column => column.ColumnOrder >= newColumn.ColumnOrder
                                                                                                 && column.PartitionKey == newColumn.PartitionKey);
        createColumnTransaction = _columnRepository.IncrementExistingColumnsOrder (columnCollectionToUpdateOrder, createColumnTransaction);

        var cardPositionCollectionToUpdateOrder = await _cardRepository.QueryCardPositionsAsync (cardPosition => cardPosition.ColumnOrder >= newColumn.ColumnOrder
                                                                                                        && cardPosition.PartitionKey == newColumn.PartitionKey);
        createColumnTransaction = _columnRepository.ApplyNewOrderForExistingCardPositions (columnCollectionToUpdateOrder, cardPositionCollectionToUpdateOrder, createColumnTransaction);

        try { await _columnRepository.SubmitArcTransactionAsync (createColumnTransaction); }
        catch (RequestFailedException reqFailedEx)
        { 
            throw new RequestFailureWrapperException (nameof (Problem), 
                                                      ErrorResponseMessages.AddToDatabaseErrorResponse (nameof (Column), reqFailedEx.Status)); 
        }
    }

    /// <summary>
    /// 
    /// </summary>
    /*private async Task<Column> UpdateColumnAndUpdateEffectedColumnsAndBoardCards (Guid boardID,
                                                                            IEnumerable<Column> columnsFromBoard,
                                                                            Column columnToUpdate,
                                                                            ColumnPatchRequest convertedColumnToUpdate, 
                                                                            IEnumerable<Microsoft.AspNetCore.JsonPatch.Operations.Operation<ColumnPatchRequest>> columnPatchRequest)
    {
        var orderIsUpdated = columnPatchRequest.Any (operation => string.Equals (operation.path, $"/{nameof (ColumnPatchRequest.Order)}", StringComparison.OrdinalIgnoreCase));
        Collection<Column>? otherColumnsWithUpdatedOrder = null;
        if (orderIsUpdated)
        {
            try { otherColumnsWithUpdatedOrder = await _columnRepository.FetchAndApplyNewOrderForEffectedColumnsAsync (columnToUpdate, convertedColumnToUpdate.Order); }
            catch (RequestFailedException reqFailedEx)
            {
                await RollbackEffectedEntitiesAndReturnErrorResponse<Column> (reqFailedEx,
                                                                              originalColumnsToRevertForFailure: columnsFromBoard);
            }
        }

        columnToUpdate = _columnMapper.MapColumnPatchRequestToColumn (convertedColumnToUpdate); // Make sure that the response object is preserved if not mapped to.
        if (otherColumnsWithUpdatedOrder is not null)
            otherColumnsWithUpdatedOrder.Add (columnToUpdate);
        var allUpdatedColumns = otherColumnsWithUpdatedOrder ?? new Collection<Column> { columnToUpdate };

        Collection<CardPosition>? cardPositionCollectionFromDatabase = null;
        try { cardPositionCollectionFromDatabase = await _cardRepository.GetCardPositionsAsync (boardID); }
        catch (RequestFailedException reqFailedEx)
        {
            await RollbackEffectedEntitiesAndReturnErrorResponse<CardPosition> (reqFailedEx,
                                                                             originalColumnsToRevertForFailure: columnsFromBoard);
        }

        try { await _columnRepository.FetchAndApplyNewOrderForEffectedBoardCardsAsync (allUpdatedColumns, cardPositionCollectionFromDatabase!); }
        catch (RequestFailedException reqFailedEx)
        {
            await RollbackEffectedEntitiesAndReturnErrorResponse<CardPosition> (reqFailedEx,
                                                                             originalColumnsToRevertForFailure: columnsFromBoard,
                                                                             originalBoardCardsToRevertForFailure: cardPositionCollectionFromDatabase);
        }

        return columnToUpdate;
    }*/

    private async Task<Column> UpdateColumnAndUpdateEffectedColumnsAndCardPositions (Guid boardID,
                                                                                     IEnumerable<Column> columnsFromBoard,
                                                                                     Column columnToUpdate,
                                                                                     ColumnPatchRequest convertedColumnToUpdate,
                                                                                     IEnumerable<Microsoft.AspNetCore.JsonPatch.Operations.Operation<ColumnPatchRequest>> columnPatchRequest)
    {
        var updateColumnTransaction = new ArcTransaction (boardID);

        var orderIsUpdated = columnPatchRequest.Any (operation => string.Equals (operation.path, $"/{nameof (ColumnPatchRequest.Order)}", StringComparison.OrdinalIgnoreCase));
        if (orderIsUpdated)
            updateColumnTransaction = _columnRepository.ApplyNewOrderForExistingColumns (columnToUpdate, convertedColumnToUpdate.Order, columnsFromBoard, updateColumnTransaction);

        columnToUpdate = _columnMapper.MapColumnPatchRequestToColumn (convertedColumnToUpdate); // Make sure that the response object is preserved if not mapped to.

        var allUpdatedColumns = (Collection<Column>) updateColumnTransaction.Select (action => action.Entity as Column);
        allUpdatedColumns.Add (columnToUpdate);
        
        updateColumnTransaction.Add (new TableTransactionAction (TableTransactionActionType.UpdateMerge, columnToUpdate));

        var cardPositionCollectionFromDatabase = await _cardRepository.GetCardPositionsAsync (boardID);
        updateColumnTransaction = _columnRepository.ApplyNewOrderForExistingCardPositions (allUpdatedColumns!, cardPositionCollectionFromDatabase!, updateColumnTransaction);

        try { await _columnRepository.SubmitArcTransactionAsync (updateColumnTransaction); }
        catch (RequestFailedException reqFailedEx)
        {
            throw new RequestFailureWrapperException (nameof (Problem),
                                                      ErrorResponseMessages.UpdateInDatabaseErrorResponse (nameof (Column), reqFailedEx.Status));
        }

        return columnToUpdate;
    }

    /// <summary>
    /// Deletes the Column passed in from the Board (ID) passed in. Then 
    /// performs the following steps:
    /// <list type="number">
    ///     <item>
    ///     Decrement any columns that follow the deleted one.
    ///     </item>
    ///     <item>
    ///     Update the ColumnOrder field on all of the BoardCards associated 
    ///     with the decremented columns.
    ///     </item>
    ///     <item>
    ///     Update the ColumnTitle field on all of the BoardCards associated 
    ///     with the deleted column.
    ///     </item>
    /// </list>
    /// If any of these fail then there will be an attempt to roll back 
    /// effected columns and cards.
    /// </summary>
    /*private async Task DeleteColumnAndUpdateEffectedColumnsAndBoardCards (Guid boardID, Column columnToDelete)
    {
        try { await _columnRepository.DeleteColumnAsync (columnToDelete); }
        catch (RequestFailedException reqFailedEx)
        { 
            throw new RequestFailureWrapperException (nameof (Problem), 
                                                      ErrorResponseMessages.RemoveFromDatabaseErrorResponse (nameof (Column), reqFailedEx.Status)); 
        }

        var columnsToUpdateOrder = await _columnRepository.QueryColumnsAsync (column => column.ColumnOrder > columnToDelete.ColumnOrder
                                                                                        && column.RowKey == columnToDelete.RowKey);
        var columnsWithUpdatedOrder = _columnRepository.DecrementExistingColumnsOrder (columnsToUpdateOrder);
        try { await _columnRepository.UpdateColumnBatchAsync (columnsWithUpdatedOrder!); }
        catch (TransactionFailedException transactionFailedEx)
        {
            await RollbackEffectedEntitiesAndReturnErrorResponse<Column> (transactionFailedEx,
                                                                          columnToAddOnFailure: columnToDelete);
        }

        IEnumerable<CardPosition>? boardCardEnumerable = null;
        try 
        { 
            boardCardEnumerable = await _cardRepository.GetCardPositionsAsync (boardID);
            await _columnRepository.FetchAndApplyNewOrderForEffectedBoardCardsAsync (columnsWithUpdatedOrder, boardCardEnumerable!);
        }
        catch (RequestFailedException reqFailedEx)
        {
            await RollbackEffectedEntitiesAndReturnErrorResponse<CardPosition> (reqFailedEx,
                                                                             columnToAddOnFailure: columnToDelete,
                                                                             originalColumnsToRevertForFailure: columnsToUpdateOrder);
        }

        try { await _columnRepository.FetchAndApplyNewTitleForEffectedBoardCardsAsync (boardID, columnToDelete); }
        catch (RequestFailedException reqFailedEx)
        {
            await RollbackEffectedEntitiesAndReturnErrorResponse<CardPosition> (reqFailedEx,
                                                                          columnToAddOnFailure: columnToDelete,
                                                                          originalColumnsToRevertForFailure: columnsToUpdateOrder,
                                                                          originalBoardCardsToRevertForFailure: boardCardEnumerable);
        }
    }*/

    private async Task DeleteColumnAndUpdateEffectedColumnsAndBoardCards (Guid boardID, Column columnToDelete)
    {
        var deleteColumnTransaction = new ArcTransaction (boardID);

        var columnsToUpdateOrder = await _columnRepository.QueryColumnsAsync (column => column.ColumnOrder > columnToDelete.ColumnOrder
                                                                                        && column.PartitionKey == columnToDelete.PartitionKey);
        deleteColumnTransaction = _columnRepository.DecrementExistingColumnsOrder (columnsToUpdateOrder, deleteColumnTransaction);

        var allUpdatedColumns = (Collection<Column>) deleteColumnTransaction.Select (action => action.Entity as Column);
        allUpdatedColumns.Add (columnToDelete);
        
        deleteColumnTransaction.Add (new TableTransactionAction (TableTransactionActionType.Delete, columnToDelete));

        var boardCardEnumerable = await _cardRepository.GetCardPositionsAsync (boardID);
        deleteColumnTransaction = _columnRepository.ApplyNewTitleAndOrderForExistingCardPositions (columnToDelete, allUpdatedColumns, boardCardEnumerable, deleteColumnTransaction);

        try { await _columnRepository.SubmitArcTransactionAsync (deleteColumnTransaction); }
        catch (RequestFailedException reqFailedEx)
        {
            throw new RequestFailureWrapperException (nameof (Problem),
                                                      ErrorResponseMessages.RemoveFromDatabaseErrorResponse (nameof (Column), reqFailedEx.Status));
        }
    }

    /// <summary>
    /// Attempts to roll back any entity to the original version passed into 
    /// the method arguments. If that succeeds then a response exception is 
    /// thrown to indicate that something went wrong but a rollback occurred. 
    /// If the rollback fails then a response exception is thrown to indicate 
    /// that something went wrong and that the rollback also failed.
    /// </summary>
    /*private async Task RollbackEffectedEntitiesAndReturnErrorResponse<T> (Exception exception,
                                                                          IEnumerable<Column>? originalColumnsToRevertForFailure = null,
                                                                          IEnumerable<CardPosition>? originalBoardCardsToRevertForFailure = null,
                                                                          Column? columnToAddOnFailure = null,
                                                                          Column? columnToDeleteOnFailure = null)
    {
        if (columnToAddOnFailure is not null)
        {
            try { await _columnRepository.AddColumnAsync (columnToAddOnFailure); }
            catch (RequestFailedException)
            {
                throw new RequestFailureWrapperException (nameof (Problem),
                                                          ErrorResponseMessages.UpdateEffectedEntitiesInDatabaseCatastrophicErrorResponse (nameof (Column), exception.Message));
            }
        }

        if (columnToDeleteOnFailure is not null)
        {
            try { await _columnRepository.DeleteColumnAsync (columnToDeleteOnFailure); }
            catch (RequestFailedException)
            {
                throw new RequestFailureWrapperException (nameof (Problem),
                                                          ErrorResponseMessages.UpdateEffectedEntitiesInDatabaseCatastrophicErrorResponse (nameof (Column), exception.Message));
            } 
        }

        if (originalColumnsToRevertForFailure is not null
            && await _columnRepository.TryRevertEffectedColumnsToOriginalAsync (originalColumnsToRevertForFailure))
            throw new RequestFailureWrapperException (nameof (Problem),
                                                      ErrorResponseMessages.UpdateEffectedEntitiesInDatabaseErrorResponse (nameof (Column), exception.Message));

        if (originalBoardCardsToRevertForFailure is not null
            && await _columnRepository.TryRevertEffectedBoardCardsToOriginalAsync (originalBoardCardsToRevertForFailure))
            throw new RequestFailureWrapperException (nameof (Problem),
                                                      ErrorResponseMessages.UpdateEffectedEntitiesInDatabaseErrorResponse (nameof (CardPosition), exception.Message));

        throw new RequestFailureWrapperException (nameof (Problem),
                                                  ErrorResponseMessages.UpdateEffectedEntitiesInDatabaseCatastrophicErrorResponse (typeof (T).Name, exception.Message));
    }*/
}