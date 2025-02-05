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
                             ISwimlaneMapper swimlaneMapper)
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
            swimlane.SwimlaneOrder ++;

            var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, swimlane);
            arcTransaction.Add (transaction, swimlane);
        }

        return arcTransaction;
    }

    public ArcTransaction DecrementExistingSwimlanesOrder (IEnumerable<Swimlane> swimlaneEnumerableToUpdate, ArcTransaction arcTransaction)
    {
        foreach (var swimlane in swimlaneEnumerableToUpdate)
        {
            swimlane.SwimlaneOrder --;

            var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, swimlane);
            arcTransaction.Add (transaction, swimlane);
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
                var newSwimlaneToUpdate = DeepCopier.Copy (boardSwimlaneEnumerable.Single (swimlane => swimlane.SwimlaneOrder == index));
                newSwimlaneToUpdate.SwimlaneOrder = index - 1;

                var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, newSwimlaneToUpdate);
                arcTransaction.Add (transaction, newSwimlaneToUpdate);
            }
        if (swimlaneToUpdate.SwimlaneOrder > newSwimlaneOrder)
            for (int index = newSwimlaneOrder; index < swimlaneToUpdate.SwimlaneOrder; index++)
            {
                var newSwimlaneToUpdate = DeepCopier.Copy (boardSwimlaneEnumerable.Single (swimlane => swimlane.SwimlaneOrder == index));
                newSwimlaneToUpdate.SwimlaneOrder = index + 1;

                var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, newSwimlaneToUpdate);
                arcTransaction.Add (transaction, newSwimlaneToUpdate);
            }

        return arcTransaction;
    }

    public ArcTransaction ApplyNewOrderForExistingCardPositions (IEnumerable<Swimlane> swimlaneEnumerable, IEnumerable<CardPosition> cardPositionEnumerable, ArcTransaction arcTransaction)
    {
        var effectedCardPositionEnumerable = cardPositionEnumerable.Where (cardPosition => swimlaneEnumerable.Any (swimlane => swimlane.Title == cardPosition.SwimlaneTitle));
        if (effectedCardPositionEnumerable.Count () is not 0)
        {
            foreach (var cardPosition in effectedCardPositionEnumerable)
            {
                cardPosition.SwimlaneOrder = swimlaneEnumerable.Single (swimlane => swimlane.Title == cardPosition.SwimlaneTitle).SwimlaneOrder;

                var transaction = new TableTransactionAction (TableTransactionActionType.UpdateMerge, cardPosition);
                arcTransaction.Add (transaction, cardPosition);
            }
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