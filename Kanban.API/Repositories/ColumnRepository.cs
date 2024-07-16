using Azure.Data.Tables;
using Kanban.Contracts.Request.Patch;
using Kanban.API.Models;
using Kanban.API.Options;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public class ColumnRepository : IColumnRepository
{
    private const string columns = "Columns";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _columnTable;

    private readonly IBoardRepository _boardRepository;

    public ColumnRepository (IOptions<CosmosOptions> cosmosOptions,
                             IBoardRepository boardRepository)
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

    public ColumnPatchRequest ApplyJsonPatchDocumentToColumn (JsonPatchDocument<ColumnPatchRequest> columnPatchRequest, Column columnToUpdate)
    {
        var convertedColumnToUpdate = new ColumnPatchRequest
        {
            Title = columnToUpdate.Title,
            Order = columnToUpdate.ColumnOrder
        };
            
        columnPatchRequest.ApplyTo (convertedColumnToUpdate);
        
        return convertedColumnToUpdate;
    }

    public Collection<Column> ApplyAllOtherColumnOrdersAsync (Collection<Column> columnCollection, int oldColumnOrder, int newColumnOrder)
    {
        if (oldColumnOrder == newColumnOrder)
            throw new Exception ("Don't pass the same column order..");

        var columnsToUpdate = new Collection<Column> ();
        if (oldColumnOrder < newColumnOrder)
            for (int index = oldColumnOrder + 1; index <= newColumnOrder; index ++)
            {
                var columnToUpdate = columnCollection.Single (column => column.ColumnOrder == index).DeepCopy ();
                columnToUpdate.ColumnOrder = index - 1;
                columnsToUpdate.Add (columnToUpdate);
            }
        if (oldColumnOrder > newColumnOrder)
            for (int index = newColumnOrder; index < oldColumnOrder; index ++)
            {
                var columnToUpdate = columnCollection.Single (column => column.ColumnOrder == index).DeepCopy ();
                columnToUpdate.ColumnOrder = index + 1;
                columnsToUpdate.Add (columnToUpdate);
            }

        return columnsToUpdate;
    }

    public async Task UpdateColumnBatchAndTheirBoardCardsAsync (Collection<Column> columnCollection)
    {
        if (columnCollection.Count is 0)
            return;

        var boardCardsFromTable = await _boardRepository.QueryBoardsAsync (board => board.PartitionKey == @"20a88077-10d4-4648-92cb-7dc7ba5b8df5");
        var filteredBoardCardsFromTable = boardCardsFromTable.Where (boardCard => columnCollection.Any (column => column.Title == boardCard.ColumnTitle));
        if (filteredBoardCardsFromTable is null || filteredBoardCardsFromTable!.Count () is 0)
            return;

        foreach (var boardCard in filteredBoardCardsFromTable)
            boardCard.ColumnOrder = columnCollection.FirstOrDefault (column => column.Title == boardCard.ColumnTitle)!.ColumnOrder;
        await _boardRepository.UpdateBoardCardBatchAsync (filteredBoardCardsFromTable);

        await UpdateColumnBatchAsync (columnCollection);
    }

    public async Task UpdateColumnToDeleteBordCardBatchAsync (Column columnToDelete, Column columnForTransfer)
    {
        var boardCardsFromTable = await _boardRepository.QueryBoardsAsync (board => board.PartitionKey == @"20a88077-10d4-4648-92cb-7dc7ba5b8df5" 
                                                                                    && board.ColumnTitle == columnToDelete.Title);

        if (boardCardsFromTable is null || boardCardsFromTable!.Count () is 0)
            return;

        foreach (var boardCard in boardCardsFromTable)
        {
            boardCard.ColumnID = Guid.Parse (columnForTransfer.PartitionKey);
            boardCard.ColumnTitle = columnForTransfer.Title;
            boardCard.ColumnOrder = columnForTransfer.ColumnOrder;
        }
        await _boardRepository.UpdateBoardCardBatchAsync (boardCardsFromTable);
    }

    public async Task UpdateColumnBatchAsync (Collection<Column> columnCollection)
    {
        foreach (var column in columnCollection)
        {
            var response = await _columnTable.UpdateEntityAsync (column, Azure.ETag.All);
            if (response.IsError)
                throw new Exception ($"Update error: {response.ReasonPhrase}");
        }
    }

    public (int oldOrder, int newOrder) GetColumnOrderChange (Column columnBeforeUpdate, ColumnPatchRequest columnAfterUpdate)
    {
        int oldOrder = columnBeforeUpdate.ColumnOrder;
        int newOrder = columnAfterUpdate.Order;
        return (oldOrder, newOrder);
    }
}