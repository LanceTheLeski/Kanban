using Azure.Data.Tables;
using Kanban.API.Models;
using Kanban.API.Options;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public class EntityRepository<T> where T : class, ITableEntity, new ()
{
    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _table;

    public EntityRepository (string tableName, 
                             IOptions<CosmosOptions> cosmosOptions)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        
        _table = _tableServiceClient.GetTableClient (tableName: tableName);
    }

    // This doesn't want to work :(
    /*public async Task<Card?> GetEntityAsync<T> (Guid partitionKeyGuid, Guid rowKeyGuid)
    {
        var response = await _table.GetEntityAsync<T> (partitionKey: partitionKeyGuid.ToString (), rowKey: rowKeyGuid.ToString ());
        return response?.Value.GetType () == typeof (T) ?
            response.Value :
            null;
    }*/

    public async Task<Azure.Response> UpdateBoardCardAsync (Board boardToUpdate)
        => await _table.UpdateEntityAsync (boardToUpdate, Azure.ETag.All);

    public async Task<Collection<Board>> QueryBoardsAsync (Expression<Func<Board, bool>> boardQueryExpression)
    {
        var boardCollection = new Collection<Board> ();

        var boardsFromTable = _table.QueryAsync (boardQueryExpression); //This seems to fail with certain expressions
        await foreach (var board in boardsFromTable)
            boardCollection.Add (board);

        return boardCollection;
    }
}