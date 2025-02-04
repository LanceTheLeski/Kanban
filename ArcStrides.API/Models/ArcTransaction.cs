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

    public ArcTransaction (Guid transactionPartitionKey,
                           Type entityType,
                           params ICollection<TableTransactionAction> transactionActions)
    {
        var tableName = entityType.GetArcTableName ();
        if (tableName is null || tableName is "")
            throw new ArgumentException ("Invalid Table Entity Type..");

        _transactionDictionary = new ()
        {
            [tableName] = new ArcTransactionCollection (transactionPartitionKey, transactionActions)
        };
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

        _transactionDictionary [tableTransactionActionEntityType!].Add (tableTransactionAction, originalEntityForRollback);
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