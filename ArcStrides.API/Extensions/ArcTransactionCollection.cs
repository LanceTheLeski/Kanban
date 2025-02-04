using ArcStrides.API.Messages;
using Azure.Data.Tables;
using System.Collections.ObjectModel;

namespace System.Collections;

public class ArcTransactionCollection : ICollection<TableTransactionAction>
{
    private readonly Guid _transactionPartitionKey;
    private readonly ICollection<TableTransactionAction> _transactionActions;

    private readonly ArcTransactionRollbackCollection _transactionRollback;

    public ArcTransactionCollection (Guid partitionKey,
                                     params ICollection<TableTransactionAction>? transactionActions)
    {
        _transactionPartitionKey = partitionKey;
        _transactionActions = transactionActions ?? new Collection<TableTransactionAction> ();

        _transactionRollback = new ArcTransactionRollbackCollection (partitionKey, transactionActions);
    }

    public ArcTransactionRollbackCollection GetTransactionRollback ()
        => _transactionRollback;

    public void Add (TableTransactionAction tableTransactionAction, ITableEntity originalTableEntity)
    {
        if (Guid.Parse (tableTransactionAction.Entity.PartitionKey) != _transactionPartitionKey)
            throw new ArgumentException (ExceptionMessages.EntityPartitionKeyDoesNotMatchTransactionExceptionMessage (tableTransactionAction.Entity.GetType ().Name));

        var actionType = tableTransactionAction.ActionType;
        if (actionType is TableTransactionActionType.UpdateReplace
            || actionType is TableTransactionActionType.UpsertReplace)
            throw new ArgumentException (ExceptionMessages.EntityActionTypeIsInvalidExceptionMessage (actionType.ToString ()));

        // We will need a conditional to ensure that this transaction is less than the number Azure restricts it to. Check MS docs for that.

        var actionToReplace = _transactionActions.FirstOrDefault (action => action.Entity.RowKey == tableTransactionAction.Entity.RowKey);
        if (actionToReplace is not null)
        {
            _transactionActions.Remove (actionToReplace);

            if ((actionToReplace.ActionType is TableTransactionActionType.Add && actionType is TableTransactionActionType.UpdateMerge)
                || (actionToReplace.ActionType is TableTransactionActionType.UpdateMerge && actionType is TableTransactionActionType.Add))
            {
                _transactionActions.Add (new (TableTransactionActionType.UpsertMerge, tableTransactionAction.Entity));
                return;
            }
        }

        _transactionActions.Add (tableTransactionAction);
        _transactionRollback.Add (tableTransactionAction, originalTableEntity);
    }

    public void Add (TableTransactionAction tableTransactionAction)
    {
        var actionType = tableTransactionAction.ActionType;

        if (actionType is TableTransactionActionType.UpdateMerge
            || actionType is TableTransactionActionType.UpdateMerge)
            throw new Exception ("Cannot use this type of method to add update actions.");

        _transactionActions.Add (tableTransactionAction);
        _transactionRollback.Add (tableTransactionAction);
    }

    public void Remove (TableTransactionAction tableTransactionAction)
    {
        _transactionActions.Remove (tableTransactionAction);

        // Add to rollback
        _transactionRollback.Remove (tableTransactionAction);
    }

    bool ICollection<TableTransactionAction>.Remove (TableTransactionAction tableTransactionAction)
    {
        Remove (tableTransactionAction);
        return true;
    }

    public int Count 
        => _transactionActions.Count;

    public bool IsReadOnly 
        => _transactionActions.IsReadOnly;

    public void Clear ()
    {
        throw new NotImplementedException (); // todo..
    }

    public bool Contains (TableTransactionAction tableTransactionAction)
        => _transactionActions.Contains (tableTransactionAction);

    public void CopyTo (TableTransactionAction [] array, int arrayIndex)
    {
        throw new NotImplementedException (); // todo..
    }

    IEnumerator IEnumerable.GetEnumerator ()
        => _transactionActions.GetEnumerator ();

    public IEnumerator<TableTransactionAction> GetEnumerator ()
        => _transactionActions.GetEnumerator ();
}