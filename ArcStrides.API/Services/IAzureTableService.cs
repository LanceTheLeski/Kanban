using ArcStrides.API.Models;
using Azure.Data.Tables;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace ArcStrides.API.Services;

public interface IAzureTableService<T> where T : class, ITableEntity, new()
{
    Task<T?> GetEntityAsync (Guid partitionKeyGuid, Guid rowKeyGuid);

    Task<T?> GetEntityAsync (int partitionKeyInt, Guid rowKeyGuid);

    Task<Collection<T>> GetEntitiesAsync (Guid partitionKeyGuid);

    Task<Collection<T>> GetEntitiesAsync (int partitionKeyInt);

    Task<Collection<T>> QueryEntitiesAsync (Expression<Func<T, bool>> entityQueryExpression);

    Task AddEntityAsync (T entityToCreate);

    Task UpdateEntityAsync (T entityToUpdate);

    Task UpdateEntityBatchAsync (IEnumerable<T> entityEnumerable);

    Task DeleteEntityAsync (T entityToDelete);

    Task<bool> SubmitArcTransactionAsync (ArcTransaction arcTransaction, bool throwExceptionOnSuccessfulRollback = false);
}