using Azure.Data.Tables;
using Kanban.API.Options;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Helpers;

public class EntityRepository<T> where T : class, ITableEntity, new()
{
    private readonly TableServiceClient _tableServiceClient;
    
    protected readonly TableClient _table;

    public EntityRepository(string tableName,
                            IOptions<CosmosOptions> cosmosOptions)
    {
        _tableServiceClient = new TableServiceClient(cosmosOptions.Value.HonuBoards);

        _table = _tableServiceClient.GetTableClient(tableName: tableName);
    }

    public async Task<T?> GetEntityAsync (Guid partitionKeyGuid, Guid rowKeyGuid)
    {
        var response = await _table.GetEntityAsync<T> (partitionKey: partitionKeyGuid.ToString (), rowKey: rowKeyGuid.ToString ());

        return response?.Value.GetType () == new T ().GetType () ?
            response.Value :
            null;
    }

    public async Task<Azure.Response> UpdateEntityAsync(T entityToUpdate)
        => await _table.UpdateEntityAsync(entityToUpdate, Azure.ETag.All);

    public async Task<Collection<T>> QueryEntitiesAsync(Expression<Func<T, bool>> boardQueryExpression)
    {
        var boardCollection = new Collection<T>();

        var boardsFromTable = _table.QueryAsync(boardQueryExpression); //This seems to fail with certain expressions
        await foreach (var entity in boardsFromTable)
            boardCollection.Add(entity);

        return boardCollection;
    }
}