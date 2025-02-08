using ArcStrides.API.Messages;
using Azure.Data.Tables;
using System.Collections.ObjectModel;

namespace System.Collections;

public class ArcTransactionRollbackCollection : ICollection<TableTransactionAction>
{
    private readonly Guid _transactionPartitionKey; // Is this needed..?
    private readonly ICollection<TableTransactionAction> _rollbackTransactionActions;

    public ArcTransactionRollbackCollection (Guid partitionKey,
                                             params ICollection<(TableTransactionAction transactionAction, ITableEntity tableEntity)>? transactionActions)
    {
        _transactionPartitionKey = partitionKey;

        // We can probably do some validating here..

        _rollbackTransactionActions = new Collection<TableTransactionAction> ();

        foreach (var transaction in transactionActions!)
            Add (transaction.transactionAction, transaction.tableEntity);
    }

    public int Count 
        => _rollbackTransactionActions.Count;

    public bool IsReadOnly 
        => _rollbackTransactionActions.IsReadOnly;

    public void Add (TableTransactionAction tableTransactionAction,
                     ITableEntity tableEntity)
    {
        var rollbackTableTransactionAction = ConvertTableEntityToTableTransactionAction (tableTransactionAction, tableEntity);

        _rollbackTransactionActions.Add (rollbackTableTransactionAction);

        var hello = 0;
    }

    public void Add (TableTransactionAction tableTransactionAction)
    {
        var actionType = tableTransactionAction.ActionType;

        if (actionType is TableTransactionActionType.UpdateMerge
            || actionType is TableTransactionActionType.UpsertMerge)
            throw new Exception ("Cannot use this type of method to add update actions. You must have the original table entity.");

        var rollbackTableTransactionAction = ConvertTableEntityToTableTransactionAction (tableTransactionAction, tableTransactionAction.Entity);

        _rollbackTransactionActions.Add (rollbackTableTransactionAction);

        var hello = 0;
    }

    public void Remove (TableTransactionAction rollbackTableTransactionAction)
    {
        _rollbackTransactionActions.Remove (rollbackTableTransactionAction);
    }

    bool ICollection<TableTransactionAction>.Remove (TableTransactionAction rollbackTableTransactionAction)
    {
        Remove (rollbackTableTransactionAction);
        return true;
    }

    public void Clear ()
    {
        throw new NotImplementedException ();
    }

    public bool Contains (TableTransactionAction tableTransactionAction)
        => _rollbackTransactionActions.Any (transactionAction => transactionAction.Entity.PartitionKey == tableTransactionAction.Entity.PartitionKey
                                                                 && transactionAction.Entity.RowKey == tableTransactionAction.Entity.RowKey);

    public void CopyTo (TableTransactionAction [] array, int arrayIndex)
    {
        throw new NotImplementedException (); // todo..
    }

    IEnumerator IEnumerable.GetEnumerator ()
        => GetEnumerator ();

    public IEnumerator<TableTransactionAction> GetEnumerator ()
        => _rollbackTransactionActions.GetEnumerator ();

    private TableTransactionAction ConvertTableEntityToTableTransactionAction (TableTransactionAction tableTransactionAction,
                                                                               ITableEntity tableEntity)
    {
        var actionType = new TableTransactionActionType ();
        switch (tableTransactionAction.ActionType)
        {
            case TableTransactionActionType.Add:
                actionType = TableTransactionActionType.Delete; 
                break;
            case TableTransactionActionType.Delete:
                actionType = TableTransactionActionType.Add;
                break;
            case TableTransactionActionType.UpdateMerge:
            case TableTransactionActionType.UpsertMerge:
                actionType = TableTransactionActionType.UpsertMerge;
                break;
            default:
                throw new Exception (ExceptionMessages.EntityActionTypeIsInvalidExceptionMessage (tableTransactionAction.ActionType.ToString ()));
        }

        return new TableTransactionAction (actionType!, tableEntity);
    }
}