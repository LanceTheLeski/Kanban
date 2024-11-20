using Kanban.Contracts.Request.Create;
using Kanban.Contracts.Request.Patch;
using Kanban.Contracts.Response;
using Kanban.API.Mappers;
using Kanban.API.Models;
using Kanban.API.Repositories;
using Kanban.API.Templates;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.JsonPatch.Exceptions;
using Microsoft.AspNetCore.Mvc;
using System.Collections.ObjectModel;
using FluentValidation;

namespace Kanban.API.Controllers;

[ApiController]
[Route ("kanban/columns")]
public class ColumnController : Controller
{
    private readonly IColumnRepository _columnRepository;
    private readonly IBoardRepository _boardRepository;

    private readonly IValidator<ColumnCreateRequest> _columnCreateRequestValidator;
    private readonly IValidator<JsonPatchDocument<ColumnPatchRequest>> _columnPatchRequestDocumentValidator;
    private readonly IColumnMapper _columnMapper;//If this fails it's because I removed the initialization of '= new ColumnMapper ()'

    public ColumnController (IColumnRepository columnRepository,
                             IBoardRepository boardRepository,
                             IValidator<ColumnCreateRequest> columnCreateRequestValidator,
                             IValidator<JsonPatchDocument<ColumnPatchRequest>> columnPatchRequestDocumentValidator,
                             IColumnMapper columnMapper)
    {
        _columnRepository = columnRepository;
        _boardRepository = boardRepository;

        _columnCreateRequestValidator = columnCreateRequestValidator;
        _columnPatchRequestDocumentValidator = columnPatchRequestDocumentValidator;
        _columnMapper = columnMapper;
    }

    [HttpGet ("{ID:guid}")]
    public async Task<ActionResult> FetchColumn (Guid ID)
    {
        var columnCollection = await _columnRepository.QueryColumnsAsync (column => column.PartitionKey == ID.ToString ());

        //If multiple boards have the same column then there will be multiple results here. I think we only need to grab the first for now
        if (columnCollection.Count () is 0)
            return NotFound ("The column you are searching for was not found.");

        //MAP
        var columnToReturn = columnCollection.First ();
        var columnResponse = new ColumnResponse
        {
            ID = Guid.Parse (columnToReturn.PartitionKey),
            Title = columnToReturn.Title,
            BoardID = Guid.Parse (columnToReturn.RowKey), //Might be an issue later if we need another board's column
            Order = columnToReturn.ColumnOrder
        };
        return Ok (columnResponse);
    }

    [HttpPost]
    public async Task<ActionResult> CreateColumn ([FromBody] ColumnCreateRequest columnCreateRequest)
    {
        var validationResult = _columnCreateRequestValidator.Validate (columnCreateRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse(nameof (ColumnCreateRequest)) 
                               + "\n" + validationResult.ToString ());

        var boardsFromTable = await _boardRepository.QueryBoardCardsAsync (board => board.PartitionKey == columnCreateRequest.BoardID.ToString ());
        if (boardsFromTable.Count () is 0)
            return BadRequest (ErrorResponseMessages.FieldDoesNotExistInDatabaseErrorResponse (nameof (ColumnCreateRequest.BoardID)));

        var newColumn = _columnMapper.MapColumnCreateRequestToColumn (columnCreateRequest);
        newColumn.PartitionKey = Guid.NewGuid ().ToString ();
        newColumn.BoardTitle = boardsFromTable.First ().Title;

        var addEntityResponse = await _columnRepository.AddColumnAsync (newColumn);
        if (addEntityResponse.IsError)
            return Problem (ErrorResponseMessages.AddToDatabaseErrorResponse (nameof (Column)) + $"\nInternal status: {addEntityResponse.Status}");

        var columnsToUpdateOrder = await _columnRepository.QueryColumnsAsync (column => column.ColumnOrder >= newColumn.ColumnOrder
                                                                                        && column.RowKey == newColumn.RowKey);

        try
        { _columnRepository.IncrementExistingColumnsWithNewOrder (columnsToUpdateOrder, newColumn); }
        catch (Exception ex)
        { return Problem (ex.Message); }
        await _columnRepository.UpdateColumnBatchAndTheirBoardCardsAsync (columnsToUpdateOrder);

        //MAP
        /*var columnResponse = new ColumnResponse
        {
            ID = Guid.Parse (newColumn.PartitionKey),
            Title = newColumn.Title,
            BoardID = Guid.Parse (newColumn.RowKey),
            Order = newColumn.ColumnOrder
        };*/
        var columnResponse = _columnMapper.MapColumnToColumnResponse (newColumn);
        return StatusCode (StatusCodes.Status201Created, columnResponse);
    }

    [HttpPatch ("{ID:Guid}")]
    public async Task<ActionResult> UpdateColumn (Guid ID, [FromBody] JsonPatchDocument<ColumnPatchRequest> columnPatchRequest)
    {
        var validationResult = _columnPatchRequestDocumentValidator.Validate (columnPatchRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (ColumnPatchRequest))
                               + "\n" + validationResult.ToString ());

        Column? columnToUpdate = await _columnRepository.GetColumnAsync (columnID: ID, boardID: new Guid (@"20a88077-10d4-4648-92cb-7dc7ba5b8df5"));
        if (columnToUpdate is null)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Column)));

        ColumnPatchRequest? convertedColumnToUpdate = null;
        try { convertedColumnToUpdate = _columnRepository.ApplyJsonPatchDocumentToColumn (columnPatchRequest, columnToUpdate); }
        catch (JsonPatchException jsonPatchEx) 
            { return BadRequest (ErrorResponseMessages.PatchRequestIsInvalidErrorResponse(nameof (Column)) + "\nDetails:\n" + jsonPatchEx.Message); }
            
        var columnOrderChange = _columnRepository.GetColumnOrderChange (columnToUpdate, convertedColumnToUpdate!);

        // MOVE to ColumnRepository
        // Name: 
        Collection<Column>? otherColumnsWithUpdatedOrder = null;
        if (columnPatchRequest.Operations.Any (operation => string.Equals (operation.path, $"/{nameof (ColumnPatchRequest.Order)}", StringComparison.OrdinalIgnoreCase)))
        {
            var columnCollection = await _columnRepository.GetAllColumnsForBoard (boardID: Guid.Parse ("20a88077-10d4-4648-92cb-7dc7ba5b8df5"));
            try { otherColumnsWithUpdatedOrder = _columnRepository.ApplyAllOtherColumnOrdersAsync (columnCollection, columnOrderChange.oldOrder, columnOrderChange.newOrder); }
            catch (Exception ex) 
                { return BadRequest (ex); }
        }

        columnToUpdate = _columnMapper.MapColumnPatchRequestToColumn (convertedColumnToUpdate); // Make sure that the response object is preserved if not mapped to.

        if (otherColumnsWithUpdatedOrder is not null)
            otherColumnsWithUpdatedOrder.Add (columnToUpdate);
        var allUpdatedColumns = otherColumnsWithUpdatedOrder ?? new Collection<Column> { columnToUpdate };
        await _columnRepository.UpdateColumnBatchAndTheirBoardCardsAsync (allUpdatedColumns);

        var columnResponse = _columnMapper.MapColumnToColumnResponse (columnToUpdate);
        return Ok (columnResponse);
    }

    [HttpDelete ("{ID:guid}")]
    public async Task<ActionResult> DeleteColumn (Guid ID)
    {
        var columnCollection = await _columnRepository.QueryColumnsAsync (column => column.PartitionKey == ID.ToString ());
        if (columnCollection.Count () is 0)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Column)));
        if (columnCollection.Count () > 1)
            return Problem (ErrorResponseMessages.TooManyEntitiesErrorResponse (nameof (Column)));

        var columnFromDatabase = columnCollection.Single ();
        var columnToDeleteResponse = await _columnRepository.DeleteColumnAsync (columnFromDatabase);
        if (columnToDeleteResponse.IsError)
            return Problem (ErrorResponseMessages.CouldNotDeleteErrorResponse (nameof (Column)));

        var columnsToUpdateOrder = await _columnRepository.QueryColumnsAsync (column => column.ColumnOrder > columnFromDatabase.ColumnOrder
                                                                                        && column.RowKey == columnFromDatabase.RowKey);
        try { columnsToUpdateOrder = _columnRepository.DecrementExistingColumnsWithNewOrder (columnsToUpdateOrder); }
        catch (Exception ex) 
            { return Problem (ex.Message); }
        await _columnRepository.UpdateColumnBatchAndTheirBoardCardsAsync (columnsToUpdateOrder);

        var columnToTransferCandidates = await _columnRepository.QueryColumnsAsync (column => column.RowKey == columnFromDatabase.RowKey
                                                                                    && (column.ColumnOrder == columnFromDatabase.ColumnOrder
                                                                                        || column.ColumnOrder == columnFromDatabase.ColumnOrder - 1));
        var columnToTransfer = columnToTransferCandidates.Count is 2 ?
            columnToTransferCandidates.MaxBy (column => column.ColumnOrder) :
            columnToTransferCandidates.Single ();
        await _columnRepository.UpdateColumnToDeleteBordCardBatchAsync (columnFromDatabase, columnToTransfer!);

        return Ok ();
    }
}