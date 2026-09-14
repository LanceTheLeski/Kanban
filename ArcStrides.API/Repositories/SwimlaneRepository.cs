using ArcStrides.API.Mappers;
using ArcStrides.API.Models;
using ArcStrides.API.Models.Board;
using ArcStrides.API.Options;
using ArcStrides.API.Services;
using Azure.Data.Tables;
using DeepCopy;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Repositories;

public class SwimlaneRepository : ISwimlaneRepository
{
    private const string swimlanes = "Swimlanes";

    private readonly IAzureTableService<Swimlane> _swimlaneTable;

    public SwimlaneRepository (IOptions<AzureTableOptions> azureTableOptions,
                               SwimlaneMapper swimlaneMapper)
    {
        _swimlaneTable = new AzureTableService<Swimlane> (swimlanes, azureTableOptions);
    }

    public async Task<Swimlane?> GetSwimlaneAsync (Guid boardID, Guid swimlaneID)
        => await _swimlaneTable.GetEntityAsync (boardID, swimlaneID);

    public async Task<Collection<Swimlane>> GetAllBoardSwimlanes (Guid boardID)
        => await _swimlaneTable.GetEntitiesAsync (boardID);

    public async Task<Collection<Swimlane>> QuerySwimlanesAsync (Expression<Func<Swimlane, bool>> swimlaneQueryExpression)
        => await _swimlaneTable.QueryEntitiesAsync (swimlaneQueryExpression);

    public async Task AddSwimlaneAsync (Swimlane swimlaneToAdd)
        => await _swimlaneTable.AddEntityAsync (swimlaneToAdd);

    public async Task UpdateSwimlaneBatchAsync (IEnumerable<Swimlane> swimlaneBatchToUpdate)
        => await _swimlaneTable.UpdateEntityBatchAsync (swimlaneBatchToUpdate);

    public async Task DeleteSwimlaneAsync (Swimlane swimlaneToDelete)
        => await _swimlaneTable.DeleteEntityAsync (swimlaneToDelete);

    public async Task<bool> SubmitArcTransactionAsync (ArcTransaction arcTransaction)
        => await _swimlaneTable.SubmitArcTransactionAsync (arcTransaction);

    public ArcTransaction IncrementExistingSwimlanesOrder (IEnumerable<Swimlane> swimlaneEnumerableToUpdate, ArcTransaction arcTransaction)
    {
        foreach (var swimlane in swimlaneEnumerableToUpdate)
        {
            // Snapshot before mutating. The second argument is the entity the
            // rollback restores, and passing the same instance that was just
            // changed meant the "original" already carried the new order -- so a
            // rollback would rewrite the value it was supposed to undo.
            var swimlaneBeforeUpdate = DeepCopier.Copy (swimlane);

            swimlane.SwimlaneOrder ++;

            var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, swimlane);
            arcTransaction.Add (transaction, swimlaneBeforeUpdate is null ? swimlane : swimlaneBeforeUpdate);
        }

        return arcTransaction;
    }

    public ArcTransaction DecrementExistingSwimlanesOrder (IEnumerable<Swimlane> swimlaneEnumerableToUpdate, ArcTransaction arcTransaction)
    {
        foreach (var swimlane in swimlaneEnumerableToUpdate)
        {
            // Snapshot before mutating. The second argument is the entity the
            // rollback restores, and passing the same instance that was just
            // changed meant the "original" already carried the new order -- so a
            // rollback would rewrite the value it was supposed to undo.
            var swimlaneBeforeUpdate = DeepCopier.Copy (swimlane);

            swimlane.SwimlaneOrder --;

            var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, swimlane);
            arcTransaction.Add (transaction, swimlaneBeforeUpdate is null ? swimlane : swimlaneBeforeUpdate);
        }

        return arcTransaction;
    }

    public ArcTransaction ApplyNewOrderForExistingSwimlanes (Swimlane swimlaneToUpdate, int newSwimlaneOrder, IEnumerable<Swimlane> boardSwimlaneEnumerable, ArcTransaction arcTransaction)
    {
        if (swimlaneToUpdate.SwimlaneOrder == newSwimlaneOrder)
            return arcTransaction;

        if (swimlaneToUpdate.SwimlaneOrder < newSwimlaneOrder)
            for (int index = swimlaneToUpdate.SwimlaneOrder + 1; index <= newSwimlaneOrder; index++)
            {
                // The copy is what gets the new order; the row as it stands is what
                // the rollback restores. Passing the mutated copy as both left the
                // rollback holding the value it was meant to undo.
                var swimlaneAtIndex = boardSwimlaneEnumerable.Single (swimlane => swimlane.SwimlaneOrder == index);
                var newSwimlaneToUpdate = DeepCopier.Copy (swimlaneAtIndex);
                newSwimlaneToUpdate.SwimlaneOrder = index - 1;

                var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, newSwimlaneToUpdate);
                arcTransaction.Add (transaction, swimlaneAtIndex);
            }
        if (swimlaneToUpdate.SwimlaneOrder > newSwimlaneOrder)
            for (int index = newSwimlaneOrder; index < swimlaneToUpdate.SwimlaneOrder; index++)
            {
                // The copy is what gets the new order; the row as it stands is what
                // the rollback restores. Passing the mutated copy as both left the
                // rollback holding the value it was meant to undo.
                var swimlaneAtIndex = boardSwimlaneEnumerable.Single (swimlane => swimlane.SwimlaneOrder == index);
                var newSwimlaneToUpdate = DeepCopier.Copy (swimlaneAtIndex);
                newSwimlaneToUpdate.SwimlaneOrder = index + 1;

                var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, newSwimlaneToUpdate);
                arcTransaction.Add (transaction, swimlaneAtIndex);
            }

        return arcTransaction;
    }

    public ArcTransaction ApplyNewOrderForExistingCardPositions (IEnumerable<Swimlane> swimlaneEnumerable, IEnumerable<CardPosition> cardPositionEnumerable, ArcTransaction arcTransaction)
    {
        // Keyed on SwimlaneID rather than Title.
        //
        // Title was both fragile and unsafe. Single() threw outright if two
        // swimlanes ever shared a title, which is exactly the state the board
        // validator is there to reject -- so a board that had drifted could not be
        // repaired by the very operations meant to reorder it. And a swimlane
        // renamed at any point left its cards matching nothing: they kept a stale
        // SwimlaneOrder while the swimlane moved, and silently, because a card that
        // matches no title is filtered out rather than reported.
        //
        // An ID cannot drift. Case-insensitive because a Guid rendered by two
        // different code paths need not agree on case.
        var swimlaneByID = swimlaneEnumerable.ToDictionary (swimlane => swimlane.RowKey, StringComparer.OrdinalIgnoreCase);

        foreach (var cardPosition in cardPositionEnumerable)
        {
            if (swimlaneByID.TryGetValue (cardPosition.SwimlaneID.ToString (), out var swimlane) is false)
                continue;

            var originalCardPosition = DeepCopier.Copy (cardPosition);

            cardPosition.SwimlaneOrder = swimlane.SwimlaneOrder;
            // CardPosition carries its own copy of the title for display. Writing it
            // here keeps the copy honest, and lets a row left stale by an earlier
            // rename heal the next time its swimlane moves.
            cardPosition.SwimlaneTitle = swimlane.Title;

            var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, cardPosition);
            arcTransaction.Add (transaction, originalCardPosition);
        }

        return arcTransaction;
    }

    public ArcTransaction ApplyNewTitleAndOrderForExistingCardPositions (Swimlane swimlaneToDelete, IEnumerable<Swimlane> swimlaneEnumerable, IEnumerable<CardPosition> cardPositionEnumerable, ArcTransaction arcTransaction)
    {
        var swimlaneToTransferCandidates = swimlaneEnumerable.Where (swimlane => swimlane.PartitionKey == swimlaneToDelete.PartitionKey
                                                                                 && (swimlane.SwimlaneOrder == swimlaneToDelete.SwimlaneOrder
                                                                                     || swimlane.SwimlaneOrder == swimlaneToDelete.SwimlaneOrder - 1));

        if (swimlaneToTransferCandidates.Count () is 0)
            return arcTransaction;
        var swimlaneToTransfer = swimlaneToTransferCandidates.Count () is 2 ?
            swimlaneToTransferCandidates.MaxBy (swimlane => swimlane.SwimlaneOrder)! :
            swimlaneToTransferCandidates.Single ();

        var cardPositionsToTransfer = cardPositionEnumerable.Where (cardPosition => cardPosition.SwimlaneTitle == swimlaneToDelete.Title)!;
        if (cardPositionsToTransfer.Count () is 0)
            return arcTransaction;
        foreach (var cardPosition in cardPositionsToTransfer)
        {
            cardPosition.SwimlaneID = Guid.Parse (swimlaneToTransfer.RowKey);
            cardPosition.SwimlaneTitle = swimlaneToTransfer.Title;
            cardPosition.SwimlaneOrder = swimlaneToTransfer.SwimlaneOrder;

            var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, cardPosition);
            arcTransaction.Add (transaction, cardPosition);
        }

        return arcTransaction;
    }
}