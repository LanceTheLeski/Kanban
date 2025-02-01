using ArcStrides.API.Exceptions;
using ArcStrides.API.Messages;
using ArcStrides.API.Options;
using System.Collections;
using System.Collections.ObjectModel;

namespace Azure.Data.Tables;

public class ArcTransaction : ICollection<TableTransactionAction>
{
    private readonly Guid _transactionPartitionKey;

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _table;

    private readonly ICollection<TableTransactionAction> _transactionActions;
    private readonly ICollection<TableTransactionAction> _transactionRollbackActions;

    private ArcTransaction? _headTransaction = null;
    private ArcTransaction? _nextTransaction = null;
    
    public ArcTransaction (Guid transactionPartitionKey, 
                           string tableName,
                           AzureTableOptions azureTableOptions,
                           params ICollection<TableTransactionAction> transactionActions)
    {
        _transactionPartitionKey = transactionPartitionKey!;

        _tableServiceClient = new TableServiceClient (azureTableOptions.ServiceEndpoint);
        _table = _tableServiceClient.GetTableClient (tableName: tableName);

        _transactionActions = transactionActions ?? new Collection<TableTransactionAction> ();
        _transactionRollbackActions = new Collection<TableTransactionAction> ();
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

        // Create the rollback transaction here and add it to the rollback transaction list..
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
    IEnumerator IEnumerable.GetEnumerator ()
        => _transactionActions.GetEnumerator ();

    /// <inheritdoc/>
    public IEnumerator<TableTransactionAction> GetEnumerator ()
        => _transactionActions.GetEnumerator ();

    /// <inheritdoc/>
    public bool Remove (TableTransactionAction item)
        => _transactionActions.Remove (item);

    public ArcTransaction? GetNextTransaction ()
        => _nextTransaction;

    protected void SetNextTransaction (ArcTransaction transactionToLink)
    {
        if (_nextTransaction is null)
            throw new Exception ($"This {nameof (ArcTransaction)} cannot link another {nameof (ArcTransaction)} because there is already one linked.");

        _nextTransaction = transactionToLink;
    }

    public ArcTransaction? GetHeadTransaction ()
        => _headTransaction;

    private void SetHeadTransaction (ArcTransaction transactionToLink)
    {
        if (_headTransaction is not null)
            throw new Exception ($"This {nameof (ArcTransaction)} cannot link another {nameof (ArcTransaction)} because there is already one linked.");
    
        _headTransaction = transactionToLink;
    }

    public void LinkArcTransaction (ArcTransaction transactionToLink)
    {
        var endTransaction = this!;
        while (endTransaction!.GetNextTransaction () is not null)
        {
            endTransaction = endTransaction.GetNextTransaction ();
        }

        endTransaction.SetNextTransaction (transactionToLink);

        if (_headTransaction is null)
            _headTransaction = this;
        transactionToLink.SetHeadTransaction (_headTransaction);
    }

    public async Task<bool> ExecuteArcTransactions ()
    {
        if (_headTransaction is null)
        {
            await SubmitArcTransactionAsync ();
            return true;
        }

        var transactionEnumerator = _headTransaction;
        do
        {
            var isSuccessful = await transactionEnumerator!.SubmitTransactionAsync ();

            if (isSuccessful is false)
            {
                // Rollback everything until we reach the current enumerator
                var isRollbackSuccessful = await ExecuteRollbackTransactions (transactionEnumerator);
                if (isRollbackSuccessful is false)
                    throw new Exception ("You're fucked :) "); // We should at least return a descriptive error or something..

                return false;
            }

            transactionEnumerator = transactionEnumerator.GetNextTransaction ();
        }
        while (transactionEnumerator is not null);

        return true;
    }

    //public async Task<bool> ExecuteArcRollbackTransactions ()
    //{
        
    //}

    // Here we want to rollback as much as possible
    private async Task<bool> ExecuteRollbackTransactions (ArcTransaction? transactionEnd = null)
    {
        bool isRollbackSuccessful = true;

        var transactionEnumerator = _headTransaction;
        do
        {
            // Rollback everything until we reach the current enumerator
            if (await ExecuteRollbackTransactions (transactionEnumerator) is false)
            {
                isRollbackSuccessful = false;
            }
            transactionEnumerator = transactionEnumerator.GetNextTransaction ();
        }
        while (transactionEnumerator is not null || transactionEnumerator == transactionEnd /*Should check the reference hopefully*/);

        return true;
    }

    public async Task SubmitArcTransactionAsync ()
    {
        var response = await _table.SubmitTransactionAsync (this);
        ValidateTransactionResponse (response);
    }

    private async Task<bool> SubmitTransactionAsync ()
    {
        var response = await _table.SubmitTransactionAsync (this);
        return IsValidTransactionResponse (response);
    }

    private async Task<bool> SubmitRollbackTransactionAsync ()
    {
        var response = await _table.SubmitTransactionAsync (this._transactionRollbackActions);
        return IsValidTransactionResponse (response);
    }

    private bool IsValidTransactionResponse (Response<IReadOnlyList<Response>> responseBatch)
    {
        var rawResponse = responseBatch.GetRawResponse ();
        if (rawResponse.IsError)
            return false;

        var exceptions = new List<RequestFailedException> ();
        foreach (var responseItem in responseBatch.Value)
            if (responseItem.IsError)
                return false;

        return true;
    }

    private void ValidateTransactionResponse (Response<IReadOnlyList<Response>> responseBatch)
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
                                                  ExceptionMessages.UpdateEntityBatchTransactionExceptionMessage (_table.Name, exceptions.Select (ex => ex.Message)
                                                                                                                                         .ToArray ()),
                                                  exceptions);
    }
}