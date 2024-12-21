using ArcStrides.API.Exceptions;
using ArcStrides.API.Mappers;
using ArcStrides.API.Messages;
using ArcStrides.API.Models;
using ArcStrides.API.Options;
using ArcStrides.API.Services;
using DeepCopy;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Repositories;

public class ColumnRepository : IColumnRepository
{
    private const string columns = "Columns";

    private readonly IAzureTableService<Column> _columnTable;

    private readonly ICardRepository _cardRepository;

    public ColumnRepository (IOptions<AzureTableOptions> azureTableOptions,
                             ICardRepository cardRepository,
                             IColumnMapper columnMapper)
    {
        _columnTable = new AzureTableService<Column> (columns, azureTableOptions);

        _cardRepository = cardRepository;
    }

    public async Task<Column?> GetColumnAsync (Guid columnID, Guid boardID)
        => await _columnTable.GetEntityAsync (columnID, boardID);

    public async Task<Collection<Column>> GetColumnsAsync (Guid columnID)
        => await _columnTable.GetEntitiesAsync (columnID);

    public async Task<Collection<Column>> GetAllBoardColumns (Guid boardID)
        => await _columnTable.QueryEntitiesAsync (column => column.RowKey == boardID.ToString ());

    public async Task<Collection<Column>> QueryColumnsAsync (Expression<Func<Column, bool>> columnQueryExpression)
        => await _columnTable.QueryEntitiesAsync (columnQueryExpression);

    public async Task AddColumnAsync (Column columnToAdd)
        => await _columnTable.AddEntityAsync (columnToAdd);

    public async Task UpdateColumnBatchAsync (IEnumerable<Column> columnBatchToUpdate)
        => await _columnTable.UpdateEntityBatchAsync (columnBatchToUpdate);

    public async Task DeleteColumnAsync (Column columnToDelete)
        => await _columnTable.DeleteEntityAsync (columnToDelete);

    public IList<Column> IncrementExistingColumnsOrder (IList<Column> columnCollectionWithNewColumnToUpdateOrder, Column newColumn)
    {
        var newColumnFromCollection = columnCollectionWithNewColumnToUpdateOrder.SingleOrDefault (column => column.PartitionKey == newColumn.PartitionKey);
        var newColumnIndex = columnCollectionWithNewColumnToUpdateOrder.IndexOf (newColumnFromCollection ?? default!);
        if (newColumnIndex is -1)
            throw new ArgumentException (ExceptionMessages.EntityCollectionDoesNotContainNewEntityExceptionMessage (nameof (Column)));

        columnCollectionWithNewColumnToUpdateOrder.RemoveAt (newColumnIndex);

        foreach (var column in columnCollectionWithNewColumnToUpdateOrder)
            column.ColumnOrder ++;

        return columnCollectionWithNewColumnToUpdateOrder;
    }

    public ICollection<Column> DecrementExistingColumnsOrder (ICollection<Column> columnCollectionToUpdate)
    {
        var columnCollectionAfterUpdate = new Collection<Column> ();

        foreach (var column in columnCollectionToUpdate)
        {
            columnCollectionAfterUpdate.Add (column);
            columnCollectionAfterUpdate.Last ().ColumnOrder --;
        }

        return columnCollectionToUpdate;
    }

    public async Task<Collection<Column>> FetchAndApplyNewOrderForEffectedColumnsAsync (Column columnToUpdate, int newColumnOrder)
    {
        var boardID = Guid.Parse(columnToUpdate.RowKey);
        var boardColumnCollection = await GetAllBoardColumns (boardID);

        var columnToUpdateCollection = new Collection<Column> ();
        if (columnToUpdate.ColumnOrder == newColumnOrder)
            return columnToUpdateCollection;

        if (columnToUpdate.ColumnOrder < newColumnOrder)
            for (int index = columnToUpdate.ColumnOrder + 1; index <= newColumnOrder; index ++)
            {
                var newColumnToUpdate = DeepCopier.Copy (boardColumnCollection.Single (column => column.ColumnOrder == index));
                newColumnToUpdate.ColumnOrder = index - 1;
                columnToUpdateCollection.Add (newColumnToUpdate);
            }
        if (columnToUpdate.ColumnOrder > newColumnOrder)
            for (int index = newColumnOrder; index < columnToUpdate.ColumnOrder; index ++)
            {
                var newColumnToUpdate = DeepCopier.Copy (boardColumnCollection.Single (column => column.ColumnOrder == index));
                newColumnToUpdate.ColumnOrder = index + 1;
                columnToUpdateCollection.Add (newColumnToUpdate);
            }

        await UpdateColumnBatchAsync (boardColumnCollection);

        return columnToUpdateCollection;
    }

    public async Task<IEnumerable<BoardCard>> FetchAndApplyNewOrderForEffectedBoardCardsAsync (IEnumerable<Column> columnEnumerable, IEnumerable<BoardCard> boardCardEnumerable)
    {
        var effectedBoardCardEnumerable = boardCardEnumerable.Where (boardCard => columnEnumerable.Any (column => column.Title == boardCard.ColumnTitle));
        if (effectedBoardCardEnumerable.Count () is not 0)
        {
            foreach (var boardCard in effectedBoardCardEnumerable)
                boardCard.ColumnOrder = columnEnumerable.Single (column => column.Title == boardCard.ColumnTitle).ColumnOrder;

            await _cardRepository.UpdateBoardCardBatchAsync (effectedBoardCardEnumerable);;
        }

        return effectedBoardCardEnumerable;
    }

    public async Task<Collection<BoardCard>> FetchAndApplyNewTitleForEffectedBoardCardsAsync (Guid boardID, Column columnToDelete)
    {
        var columnToTransferCandidates = await QueryColumnsAsync (column => column.RowKey == columnToDelete.RowKey
                                                                            && (column.ColumnOrder == columnToDelete.ColumnOrder
                                                                                || column.ColumnOrder == columnToDelete.ColumnOrder - 1));
        if (columnToTransferCandidates.Count () is 0)
            return new Collection<BoardCard> ();
        var columnToTransfer = columnToTransferCandidates.Count is 2 ?
            columnToTransferCandidates.MaxBy (column => column.ColumnOrder) :
            columnToTransferCandidates.Single ();

        var boardCardsFromTable = await _cardRepository.QueryBoardCardsAsync (board => board.PartitionKey == boardID.ToString ()
                                                                                       && board.ColumnTitle == columnToDelete.Title);
        if (boardCardsFromTable!.Count () is 0) 
            return new Collection<BoardCard> ();
        foreach (var boardCard in boardCardsFromTable)
        {
            boardCard.ColumnID = Guid.Parse (columnToTransfer!.PartitionKey);
            boardCard.ColumnTitle = columnToTransfer!.Title;
            boardCard.ColumnOrder = columnToTransfer!.ColumnOrder;
        }
        await _cardRepository.UpdateBoardCardBatchAsync (boardCardsFromTable);

        return boardCardsFromTable;
    }
    
    public async Task<bool> TryRevertEffectedColumnsToOriginalAsync (IEnumerable<Column> originalColumnEnumerable)
    {
        try { await UpdateColumnBatchAsync (originalColumnEnumerable); }
        catch (TransactionFailedException)
            { return false; } // Nothing more to do here. We should be more concerned with the failures that led up to this point.

        return true;
    }
    
    public async Task<bool> TryRevertEffectedBoardCardsToOriginalAsync (IEnumerable<BoardCard> originalBoardCardEnumerable)
    {
        try { await _cardRepository.UpdateBoardCardBatchAsync (originalBoardCardEnumerable); }
        catch (TransactionFailedException)
            { return false; } // Nothing more to do here. We should be more concerned with the failures that led up to this point.

        return true;
    }
}