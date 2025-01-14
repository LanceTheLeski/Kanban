using ArcStrides.API.Messages;
using Azure.Data.Tables;
using System.Collections.ObjectModel;

namespace System.Collections.Generic;//We might want to consider extending something else..

public class ArcTransaction : ICollection<TableTransactionAction>
{
    private readonly Guid _transactionPartitionKey;

    private readonly ICollection<TableTransactionAction> _transactionActions;
    
    public ArcTransaction (Guid transactionPartitionKey, 
                           params ICollection<TableTransactionAction> transactionActions)
    {
        _transactionPartitionKey = transactionPartitionKey!;

        _transactionActions = transactionActions ?? new Collection<TableTransactionAction> ();
    }

    /// <inheritdoc/>
    public int Count
        => _transactionActions.Count;

    /// <inheritdoc/>
    public bool IsReadOnly
        => _transactionActions.IsReadOnly;

    /// <inheritdoc/>
    public void Add (TableTransactionAction item)
    {
        if (Guid.Parse (item.Entity.PartitionKey) != _transactionPartitionKey)
            throw new ArgumentException (ExceptionMessages.EntityPartitionKeyDoesNotMatchTransactionExceptionMessage (item.Entity.GetType ().Name));

        var actionType = item.ActionType;
        if (actionType is TableTransactionActionType.UpdateReplace
            || actionType is TableTransactionActionType.UpsertReplace)
            throw new ArgumentException (ExceptionMessages.EntityActionTypeIsInvalidExceptionMessage (actionType.ToString ()));

        // We will need a conditional to ensure that this transaction is less than the number Azure restricts it to. Check MS docs for that.
        //if ()

        var actionToReplace = _transactionActions.FirstOrDefault (action => action.Entity.RowKey == item.Entity.RowKey);
        if (actionToReplace is not null)
        {
            _transactionActions.Remove (actionToReplace);

            if ((actionToReplace.ActionType is TableTransactionActionType.Add && actionType is TableTransactionActionType.UpdateMerge)
                || (actionToReplace.ActionType is TableTransactionActionType.UpdateMerge && actionType is TableTransactionActionType.Add))
            {
                _transactionActions.Add (new (TableTransactionActionType.UpsertMerge, item.Entity));
                return;
            }
        }
        _transactionActions.Add (item);
    }

    /// <inheritdoc/>
    public void Clear ()
        => _transactionActions.Clear ();

    /// <inheritdoc/>
    public bool Contains (TableTransactionAction item)
        => _transactionActions.Contains (item);

    /// <inheritdoc/>
    public void CopyTo (TableTransactionAction [] array, int arrayIndex)
        => _transactionActions.CopyTo (array, arrayIndex);

    /// <inheritdoc/>
    public IEnumerator<TableTransactionAction> GetEnumerator ()
        => _transactionActions.GetEnumerator ();

    /// <inheritdoc/>
    public bool Remove (TableTransactionAction item)
        => _transactionActions.Remove (item);

    /// <inheritdoc/>
    IEnumerator IEnumerable.GetEnumerator () 
        => _transactionActions.GetEnumerator ();
}