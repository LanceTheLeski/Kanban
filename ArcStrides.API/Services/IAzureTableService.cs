using ArcStrides.API.Models;
using Azure.Data.Tables;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace ArcStrides.API.Services;

public interface IAzureTableService<T> where T : class, ITableEntity, new()
{
    Task<T?> GetEntityAsync (Guid partitionKeyGuid, Guid rowKeyGuid);

    Task<T?> GetEntityAsync (Guid partitionKeyGuid, int rowKeyInt);

    Task<Collection<T>> GetEntitiesAsync (Guid partitionKeyGuid);

    Task<Collection<T>> GetEntitiesAsync (int partitionKeyInt);

    Task<Collection<T>> QueryEntitiesAsync (Expression<Func<T, bool>> entityQueryExpression);

    Task AddEntityAsync (T entityToCreate);

    /// <summary>
    /// Merges the entity into its stored row: the properties it has are written, and
    /// the stored row keeps any it does not. A null property is not sent at all, so a
    /// value cannot be cleared this way — see ReplaceEntityAsync.
    /// </summary>
    Task UpdateEntityAsync (T entityToUpdate);

    /// <summary>
    /// Writes the entity over its stored row whole, nulls included. For an entity that
    /// was read in full and changed, where a property set to null has to be cleared.
    /// </summary>
    Task ReplaceEntityAsync (T entityToReplace);

    Task UpdateEntityBatchAsync (IEnumerable<T> entityEnumerable);

    Task DeleteEntityAsync (T entityToDelete);

    Task<bool> SubmitArcTransactionAsync (ArcTransaction arcTransaction, bool throwExceptionOnSuccessfulRollback = false);
}