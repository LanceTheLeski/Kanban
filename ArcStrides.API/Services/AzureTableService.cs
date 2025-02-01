using ArcStrides.API.Exceptions;
using ArcStrides.API.Messages;
using ArcStrides.API.Options;
using Azure;
using Azure.Data.Tables;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace ArcStrides.API.Services;

public class AzureTableService<T> : IAzureTableService<T> where T : class, ITableEntity, new()
{
    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _table;

    public AzureTableService (string tableName,
                              IOptions<AzureTableOptions> azureTableOptions)
    {
        _tableServiceClient = new TableServiceClient (azureTableOptions.Value.ServiceEndpoint);
        _table = _tableServiceClient.GetTableClient (tableName: tableName);
    }

    public async Task<T?> GetEntityAsync (Guid partitionKeyGuid, Guid rowKeyGuid)
    {
        var response = await _table.GetEntityAsync<T> (partitionKey: partitionKeyGuid.ToString (), rowKey: rowKeyGuid.ToString ());

        return response?.Value.GetType () == new T ().GetType () ?
            response.Value :
            null;
    }

    public async Task<T?> GetEntityAsync (int partitionKeyInt, Guid rowKeyGuid)
    {
        var response = await _table.GetEntityAsync<T> (partitionKey: partitionKeyInt.ToString (), rowKey: rowKeyGuid.ToString ());

        return response?.Value.GetType () == new T ().GetType () ?
            response.Value :
            null;
    }

    public async Task<Collection<T>> GetEntitiesAsync (Guid partitionKeyGuid)
        => await QueryEntitiesAsync (entity => entity.PartitionKey == partitionKeyGuid.ToString ());

    public async Task<Collection<T>> GetEntitiesAsync (int partitionKeyInt)
        => await QueryEntitiesAsync (entity => entity.PartitionKey == partitionKeyInt.ToString ());

    public async Task<Collection<T>> QueryEntitiesAsync (Expression<Func<T, bool>> entityQueryExpression)
    {
        var entityList = new Collection<T> ();

        try
        {
            var entitiesFromTable = _table.QueryAsync (entityQueryExpression); // This fails with most expressions! We cannot use LINQ here - only direct equality expressions.
            await foreach (var entity in entitiesFromTable)
                entityList.Add (entity);
        }
        catch (Exception ex) 
            { throw new RequestFailedException (ExceptionMessages.EntityQueryFailedExceptionMessage (typeof (T).Name), ex); }

        return entityList;
    }

    public async Task AddEntityAsync (T entityToCreate)
    { 
        var response = await _table.AddEntityAsync (entityToCreate);
        ValidateResponse (response);
    }

    public async Task UpdateEntityAsync (T entityToUpdate)
    { 
        var response = await _table.UpdateEntityAsync (entityToUpdate, ETag.All);
        ValidateResponse (response);
    }

    public async Task UpdateEntityBatchAsync (IEnumerable<T> entityEnumerable)
    {
        var tableTransactionList = new List<TableTransactionAction> ();
        foreach (var entity in entityEnumerable)
            tableTransactionList.Add (new (TableTransactionActionType.UpdateMerge, entity));

        var response = await _table.SubmitTransactionAsync (tableTransactionList);

        ValidateTransactionResponse (response);
    }

    public async Task DeleteEntityAsync (T entityToDelete)
    {
        var response = await _table.DeleteEntityAsync (entityToDelete, ETag.All);
        ValidateResponse (response);
    }

    /*public async Task<bool> SubmitArcTransactionAsync (ArcTransaction arcTransaction)
    {
        var response = await _table.SubmitTransactionAsync (arcTransaction);
        ValidateTransactionResponse (response);
        return true;
    }*/

    private void ValidateResponse (Response response)
    {
        if (response.IsError)
            throw new RequestFailedException (response.Status, response.ReasonPhrase);
    }

    /*private void ValidateTransactionResponse (Response<IReadOnlyList<Response>> responseBatch)
    {
        var rawResponse = responseBatch.GetRawResponse ();
        if (rawResponse.IsError)
            throw new TransactionFailedException (rawResponse.Status, rawResponse.ReasonPhrase);

        var batchIsSuccessful = true;

        var exceptions = new List<RequestFailedException> ();
        foreach (var responseItem in responseBatch.Value)
            if (responseItem.IsError)
            {
                exceptions.Add (new RequestFailedException (responseItem));
                batchIsSuccessful = false;
            }

        if (batchIsSuccessful is false)
            throw new TransactionFailedException (StatusCodes.Status500InternalServerError,
                                                  ExceptionMessages.UpdateEntityBatchTransactionExceptionMessage (typeof (T).Name, exceptions.Select (ex => ex.Message)
                                                                                                                                             .ToArray ()),
                                                  exceptions);
    }*/
}