using Azure.Data.Tables;
using Kanban.Components.DTOs;
using Kanban.Contexts;
using Kanban.Models;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.Repositories;

public class ColumnRepository
{
    private const string columns = "Columns";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _columnTable;

    private readonly BoardRepository _boardRepository;

    public ColumnRepository (IOptions<CosmosOptions> cosmosOptions,
                             BoardRepository boardRepository)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _columnTable = _tableServiceClient.GetTableClient (tableName: columns);

        _boardRepository = boardRepository;
    }

    public async Task<Collection<Column>> GetAllColumnsForBoard (Guid boardID)
    {
        var columnCollection = new Collection<Column> ();

        var columnsFromTable = _columnTable.QueryAsync<Column> (column => column.RowKey == boardID.ToString ());
        await foreach (var column in columnsFromTable)
            columnCollection.Add (column);

        return columnCollection;
    }

    public async Task<Column?> GetColumnAsync (Guid columnID, Guid boardID)
    {
        var response = await _columnTable.GetEntityAsync<Column> (partitionKey: columnID.ToString (), rowKey: boardID.ToString ());
        return response?.Value.GetType () == typeof (Column) ? 
            response.Value : 
            null;
    }

    public async Task<Collection<Column>> QueryColumnsAsync (Expression<Func<Column, bool>> columnQueryExpression)
    {
        var columnCollection = new Collection<Column> ();

        var columnsFromTable = _columnTable.QueryAsync (columnQueryExpression);
        await foreach (var column in columnsFromTable)
            columnCollection.Add (column);

        return columnCollection;
    }

    public bool TryApplyJsonPatchDocumentToColumn (JsonPatchDocument<ColumnPatchRequest> columnPatchRequest, Column columnToUpdate, out ColumnPatchRequest convertedColumnToUpdate)
    {
        convertedColumnToUpdate = new ColumnPatchRequest
        {
            Title = columnToUpdate.Title,
            Order = columnToUpdate.ColumnOrder
        };

        columnPatchRequest.ApplyTo (convertedColumnToUpdate);

        if (false)//ModelState is not valid
            return false;

        return true;
    }

    public async Task<Collection<Column>> UpdateAllOtherColumnOrdersAsync (Collection<Column> columnCollection, int oldColumnOrder, int newColumnOrder)
    {
        if (oldColumnOrder == newColumnOrder)
            throw new Exception ("Don't pass the same column order..");

        Collection<TableTransactionAction> columnTableTransaction = new Collection<TableTransactionAction> ();
        if (oldColumnOrder < newColumnOrder)
            for (int index = oldColumnOrder + 1; index <= newColumnOrder; index++)
            {
                columnCollection [index].ColumnOrder = index - 1;
                columnTableTransaction.Add (new (TableTransactionActionType.UpdateMerge, columnCollection [index]));
            }
        if (oldColumnOrder > newColumnOrder)
            for (int index = newColumnOrder; index < newColumnOrder; index++)
            {
                columnCollection [index].ColumnOrder = index + 1;
                columnTableTransaction.Add (new (TableTransactionActionType.UpdateMerge, columnCollection [index]));
            }
        var transactionResponse = await _columnTable.SubmitTransactionAsync (columnTableTransaction);
        if (transactionResponse.GetRawResponse ().IsError)
            throw new Exception ("We could not update all columns with new column data.");

        return columnCollection;
    }

    public async Task UpdateBoardCardsWithNewColumnInfoAsync (Collection<Column> columnCollection)
    {
        var boardCardsFromTable = await _boardRepository.QueryBoardsAsync (board => board.PartitionKey == @"20a88077-10d4-4648-92cb-7dc7ba5b8df5"
                                                                                    && columnCollection.Any (column => column.Title == board.ColumnTitle));
        
        Collection<TableTransactionAction> columnTableTransaction = new Collection<TableTransactionAction> ();
        foreach (var boardCard in boardCardsFromTable)
        {
            boardCard.ColumnOrder = columnCollection.FirstOrDefault (column => column.Title == boardCard.ColumnTitle)!.ColumnOrder;
            columnTableTransaction.Add (new (TableTransactionActionType.UpdateMerge, boardCard));
        }

        var transactionResponse = await _columnTable.SubmitTransactionAsync (columnTableTransaction);
        if (transactionResponse.GetRawResponse ().IsError)
            throw new Exception ("We could not update cards with new column data.");
    }

    public (int oldOrder, int newOrder) GetColumnOrderChange (Column columnBeforeUpdate, ColumnPatchRequest columnAfterUpdate)
    {
        int oldOrder = columnBeforeUpdate.ColumnOrder;
        int newOrder = columnAfterUpdate.Order;
        return (oldOrder, newOrder);
    }
}