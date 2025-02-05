using Azure.Data.Tables;
using System.Collections;

namespace ArcStrides.API.Models;

public class ArcTransaction
{
    private readonly Dictionary<string, ArcTransactionCollection> _transactionDictionary;

    public ArcTransaction ()
    {
        _transactionDictionary = new ();
    }

    public ArcTransaction (params ICollection<(TableTransactionAction transactionAction, ITableEntity originalTableEntity)> transactionTuples)
    {
        _transactionDictionary = new ();

        foreach (var transactionTuple in transactionTuples)
            Add (transactionTuple.transactionAction, transactionTuple.originalTableEntity);
    }

    public IDictionary<string, ArcTransactionCollection> GetTransactionDictionary ()
        => _transactionDictionary;

    public IEnumerable<ArcTransactionCollection> GetTransactions ()
        => _transactionDictionary.Values;

    public IEnumerable<ArcTransactionRollbackCollection> GetRollbackTransactions ()
        => _transactionDictionary.Values.Select (transactionCollection => transactionCollection.GetTransactionRollback ());

    // & Update
    public void Add (TableTransactionAction tableTransactionAction, ITableEntity originalEntityForRollback)
    {
        if (tableTransactionAction.Entity.RowKey != originalEntityForRollback.RowKey)
            throw new ArgumentException ("The given entities do not have a matching RowKey.");

        var tableTransactionActionEntityType = tableTransactionAction.Entity.GetType ().GetArcTableName ();
        var originalEntityForRollbackEntityType = originalEntityForRollback.GetType ().GetArcTableName ();

        if (tableTransactionActionEntityType is not null
            && tableTransactionActionEntityType != originalEntityForRollbackEntityType)
            throw new ArgumentException ("The given entities do not have a matching table name.");

        if (_transactionDictionary.ContainsKey (tableTransactionActionEntityType!))
            _transactionDictionary [tableTransactionActionEntityType!].Add (tableTransactionAction, originalEntityForRollback);
        else
            _transactionDictionary.Add (tableTransactionActionEntityType!, new ArcTransactionCollection (Guid.Parse (originalEntityForRollback.PartitionKey),
                                                                                                         (tableTransactionAction, originalEntityForRollback)));
    }

    public void Remove (TableTransactionAction tableTransactionAction, ITableEntity originalEntityForRollback)
    {
        if (tableTransactionAction.Entity.RowKey != originalEntityForRollback.RowKey)
            throw new ArgumentException ("The given entities do not have a matching RowKey.");

        var tableTransactionActionEntityType = tableTransactionAction.Entity.GetType ().GetArcTableName ();
        var originalEntityForRollbackEntityType = originalEntityForRollback.GetType ().GetArcTableName ();

        if (tableTransactionActionEntityType is not null
            && tableTransactionActionEntityType != originalEntityForRollbackEntityType)
            throw new ArgumentException ("The given entities do not have a matching table name.");

        _transactionDictionary [tableTransactionActionEntityType!].Remove (tableTransactionAction);
    }
}