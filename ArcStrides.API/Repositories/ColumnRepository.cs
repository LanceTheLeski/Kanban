using ArcStrides.API.Mappers;
using ArcStrides.API.Models;
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
                             ColumnMapper columnMapper)
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

            var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, column);
            arcTransaction.Add (transaction, column);
        }

        return arcTransaction;
    }

    public ArcTransaction DecrementExistingColumnsOrder (IEnumerable<Column> columnEnumerableToUpdate, ArcTransaction arcTransaction)
    {
        foreach (var column in columnEnumerableToUpdate)
        {
            column.ColumnOrder --;

            var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, column);
            arcTransaction.Add (transaction, column);
        }

        return arcTransaction;
    }

    public ArcTransaction ApplyNewOrderForExistingColumns (Column columnToUpdate, int newColumnOrder, IEnumerable<Column> boardColumnEnumerable, ArcTransaction arcTransaction)
    {
        if (columnToUpdate.ColumnOrder == newColumnOrder)
            return arcTransaction;

        if (columnToUpdate.ColumnOrder < newColumnOrder)
            for (int index = columnToUpdate.ColumnOrder.Value + 1; index <= newColumnOrder; index ++)
            {
                var currentColumnToUpdate = boardColumnEnumerable.Single (column => column.ColumnOrder == index);
                var newColumnToUpdate = DeepCopier.Copy (currentColumnToUpdate);
                newColumnToUpdate.ColumnOrder = index - 1;

                var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, newColumnToUpdate);
                arcTransaction.Add (transaction, currentColumnToUpdate);
            }
        if (columnToUpdate.ColumnOrder > newColumnOrder)
            for (int index = newColumnOrder; index < columnToUpdate.ColumnOrder; index ++)
            {
                var currentColumnToUpdate = boardColumnEnumerable.Single (column => column.ColumnOrder == index);
                var newColumnToUpdate = DeepCopier.Copy (currentColumnToUpdate);
                newColumnToUpdate.ColumnOrder = index + 1;

                var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, newColumnToUpdate);
                arcTransaction.Add (transaction, newColumnToUpdate);
            }
          
        return arcTransaction;
    }

    public ArcTransaction ApplyNewOrderForExistingCardPositions (IEnumerable<Column> columnEnumerable, IEnumerable<CardPosition> cardPositionEnumerable, ArcTransaction arcTransaction)
    {
        var effectedCardPositionEnumerable = cardPositionEnumerable.Where (cardPosition => columnEnumerable.Any (column => column.Title == cardPosition.ColumnTitle));
        foreach (var cardPosition in effectedCardPositionEnumerable)
        {
            var originalCardPosition = DeepCopier.Copy (cardPosition);
            cardPosition.ColumnOrder = columnEnumerable.Single (column => column.Title == cardPosition.ColumnTitle).ColumnOrder.Value;

            var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, cardPosition);
            arcTransaction.Add (transaction, originalCardPosition);
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
            cardPosition.ColumnOrder = columnToTransfer.ColumnOrder.Value;

            var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, cardPosition);
            arcTransaction.Add (transaction, cardPosition);
        }

        return arcTransaction;
    }
}