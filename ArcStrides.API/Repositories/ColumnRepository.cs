using ArcStrides.API.Mappers;
using ArcStrides.API.Models.Board;
using ArcStrides.API.Options;
using ArcStrides.API.Services;
using Azure.Data.Tables;
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

    public ColumnRepository (IOptions<AzureTableOptions> azureTableOptions,
                             IColumnMapper columnMapper)
    {
        _columnTable = new AzureTableService<Column> (columns, azureTableOptions);
    }

    public async Task<Column?> GetColumnAsync (Guid boardID, Guid columnID)
        => await _columnTable.GetEntityAsync (boardID, columnID);

    public async Task<Collection<Column>> GetAllBoardColumns (Guid boardID)
        => await _columnTable.GetEntitiesAsync (boardID);

    public async Task<Collection<Column>> QueryColumnsAsync (Expression<Func<Column, bool>> columnQueryExpression)
        => await _columnTable.QueryEntitiesAsync (columnQueryExpression);

    public async Task AddColumnAsync (Column columnToAdd)
        => await _columnTable.AddEntityAsync (columnToAdd);

    public async Task UpdateColumnBatchAsync (IEnumerable<Column> columnBatchToUpdate)
        => await _columnTable.UpdateEntityBatchAsync (columnBatchToUpdate);

    public async Task DeleteColumnAsync (Column columnToDelete)
        => await _columnTable.DeleteEntityAsync (columnToDelete);

    public async Task<bool> SubmitArcTransactionAsync (ArcTransaction arcTransaction)
        => await _columnTable.SubmitArcTransactionAsync (arcTransaction);

    public ArcTransaction IncrementExistingColumnsOrder (IEnumerable<Column> columnEnumerableToUpdate, ArcTransaction arcTransaction)
    {
        foreach (var column in columnEnumerableToUpdate)
        {
            column.ColumnOrder ++;
            arcTransaction.Add (new (TableTransactionActionType.UpdateMerge, column));
        }

        return arcTransaction;
    }

    public ArcTransaction DecrementExistingColumnsOrder (IEnumerable<Column> columnEnumerableToUpdate, ArcTransaction arcTransaction)
    {
        foreach (var column in columnEnumerableToUpdate)
        {
            column.ColumnOrder --;
            arcTransaction.Add (new (TableTransactionActionType.UpdateMerge, column));
        }

        return arcTransaction;
    }

    public ArcTransaction ApplyNewOrderForExistingColumns (Column columnToUpdate, int newColumnOrder, IEnumerable<Column> boardColumnEnumerable, ArcTransaction arcTransaction)
    {
        if (columnToUpdate.ColumnOrder == newColumnOrder)
            return arcTransaction;

        if (columnToUpdate.ColumnOrder < newColumnOrder)
            for (int index = columnToUpdate.ColumnOrder + 1; index <= newColumnOrder; index ++)
            {
                var newColumnToUpdate = DeepCopier.Copy (boardColumnEnumerable.Single (column => column.ColumnOrder == index));
                newColumnToUpdate.ColumnOrder = index - 1;
                arcTransaction.Add (new (TableTransactionActionType.UpdateMerge, newColumnToUpdate));
            }
        if (columnToUpdate.ColumnOrder > newColumnOrder)
            for (int index = newColumnOrder; index < columnToUpdate.ColumnOrder; index ++)
            {
                var newColumnToUpdate = DeepCopier.Copy (boardColumnEnumerable.Single (column => column.ColumnOrder == index));
                newColumnToUpdate.ColumnOrder = index + 1;
                arcTransaction.Add (new (TableTransactionActionType.UpdateMerge, newColumnToUpdate));
            }
          
        return arcTransaction;
    }

    public ArcTransaction ApplyNewOrderForExistingCardPositions (IEnumerable<Column> columnEnumerable, IEnumerable<CardPosition> cardPositionEnumerable, ArcTransaction arcTransaction)
    {
        var effectedCardPositionEnumerable = cardPositionEnumerable.Where (boardCard => columnEnumerable.Any (column => column.Title == boardCard.ColumnTitle));
        if (effectedCardPositionEnumerable.Count () is not 0)
        {
            foreach (var boardCard in effectedCardPositionEnumerable)
            {
                boardCard.ColumnOrder = columnEnumerable.Single (column => column.Title == boardCard.ColumnTitle).ColumnOrder;

                arcTransaction.Add (new (TableTransactionActionType.UpdateMerge, boardCard));
            }
        }

        return arcTransaction;
    }

    public ArcTransaction ApplyNewTitleAndOrderForExistingCardPositions (Column columnToDelete, IEnumerable<Column> columnEnumerable, IEnumerable<CardPosition> cardPositionEnumerable, ArcTransaction arcTransaction)
    {
        var columnToTransferCandidates = columnEnumerable.Where (column => column.PartitionKey == columnToDelete.PartitionKey
                                                                           && (column.ColumnOrder == columnToDelete.ColumnOrder
                                                                               || column.ColumnOrder == columnToDelete.ColumnOrder - 1));

        if (columnToTransferCandidates.Count () is 0)
            return arcTransaction;
        var columnToTransfer = columnToTransferCandidates.Count() is 2 ?
            columnToTransferCandidates.MaxBy (column => column.ColumnOrder)! :
            columnToTransferCandidates.Single ();

        var cardPositionsToTransfer = cardPositionEnumerable.Where (cardPosition => cardPosition.ColumnTitle == columnToDelete.Title)!;
        if (cardPositionsToTransfer.Count () is 0) 
            return arcTransaction;
        foreach (var cardPosition in cardPositionsToTransfer)
        {
            cardPosition.ColumnID = Guid.Parse (columnToTransfer.RowKey);
            cardPosition.ColumnTitle = columnToTransfer.Title;
            cardPosition.ColumnOrder = columnToTransfer.ColumnOrder;
            
            arcTransaction.Add (new (TableTransactionActionType.UpdateMerge, cardPosition));
        }

        return arcTransaction;
    }
}