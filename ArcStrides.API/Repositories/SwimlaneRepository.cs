using ArcStrides.API.Exceptions;
using ArcStrides.API.Mappers;
using ArcStrides.API.Messages;
using ArcStrides.API.Models;
using ArcStrides.API.Options;
using ArcStrides.API.Services;
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

    private readonly ICardRepository _cardRepository;

    public SwimlaneRepository (IOptions<AzureTableOptions> azureTableOptions,
                             ICardRepository cardRepository,
                             ISwimlaneMapper swimlaneMapper)
    {
        _swimlaneTable = new AzureTableService<Swimlane> (swimlanes, azureTableOptions);

        _cardRepository = cardRepository;
    }

    public async Task<Swimlane?> GetSwimlaneAsync (Guid swimlaneID, Guid boardID)
        => await _swimlaneTable.GetEntityAsync (swimlaneID, boardID);

    public async Task<Collection<Swimlane>> GetSwimlanesAsync (Guid swimlaneID)
        => await _swimlaneTable.GetEntitiesAsync (swimlaneID);

    public async Task<Collection<Swimlane>> GetAllBoardSwimlanes (Guid boardID)
        => await _swimlaneTable.QueryEntitiesAsync (swimlane => swimlane.RowKey == boardID.ToString ());

    public async Task<Collection<Swimlane>> QuerySwimlanesAsync (Expression<Func<Swimlane, bool>> swimlaneQueryExpression)
        => await _swimlaneTable.QueryEntitiesAsync (swimlaneQueryExpression);

    public async Task AddSwimlaneAsync (Swimlane swimlaneToAdd)
        => await _swimlaneTable.AddEntityAsync (swimlaneToAdd);

    public async Task UpdateSwimlaneBatchAsync (IEnumerable<Swimlane> swimlaneBatchToUpdate)
        => await _swimlaneTable.UpdateEntityBatchAsync (swimlaneBatchToUpdate);

    public async Task DeleteSwimlaneAsync (Swimlane swimlaneToDelete)
        => await _swimlaneTable.DeleteEntityAsync (swimlaneToDelete);

    public IList<Swimlane> IncrementExistingSwimlanesOrder (IList<Swimlane> swimlaneCollectionWithNewSwimlaneToUpdateOrder, Swimlane newSwimlane)
    {
        var newSwimlaneFromCollection = swimlaneCollectionWithNewSwimlaneToUpdateOrder.SingleOrDefault (swimlane => swimlane.PartitionKey == newSwimlane.PartitionKey);
        var newSwimlaneIndex = swimlaneCollectionWithNewSwimlaneToUpdateOrder.IndexOf (newSwimlaneFromCollection ?? default!);
        if (newSwimlaneIndex is -1)
            throw new ArgumentException (ExceptionMessages.EntityCollectionDoesNotContainNewEntityExceptionMessage (nameof (Swimlane)));

        swimlaneCollectionWithNewSwimlaneToUpdateOrder.RemoveAt (newSwimlaneIndex);

        foreach (var swimlane in swimlaneCollectionWithNewSwimlaneToUpdateOrder)
            swimlane.SwimlaneOrder++;

        return swimlaneCollectionWithNewSwimlaneToUpdateOrder;
    }

    public ICollection<Swimlane> DecrementExistingSwimlanesOrder (ICollection<Swimlane> swimlaneCollectionToUpdate)
    {
        var swimlaneCollectionAfterUpdate = new Collection<Swimlane> ();

        foreach (var swimlane in swimlaneCollectionToUpdate)
        {
            swimlaneCollectionAfterUpdate.Add (swimlane);
            swimlaneCollectionAfterUpdate.Last ().SwimlaneOrder--;
        }

        return swimlaneCollectionToUpdate;
    }

    public async Task<Collection<Swimlane>> FetchAndApplyNewOrderForEffectedSwimlanesAsync (Swimlane swimlaneToUpdate, int newSwimlaneOrder)
    {
        var boardID = Guid.Parse (swimlaneToUpdate.RowKey);
        var boardSwimlaneCollection = await GetAllBoardSwimlanes (boardID);

        var swimlaneToUpdateCollection = new Collection<Swimlane> ();
        if (swimlaneToUpdate.SwimlaneOrder == newSwimlaneOrder)
            return swimlaneToUpdateCollection;

        if (swimlaneToUpdate.SwimlaneOrder < newSwimlaneOrder)
            for (int index = swimlaneToUpdate.SwimlaneOrder + 1; index <= newSwimlaneOrder; index++)
            {
                var newSwimlaneToUpdate = DeepCopier.Copy (boardSwimlaneCollection.Single (swimlane => swimlane.SwimlaneOrder == index));
                newSwimlaneToUpdate.SwimlaneOrder = index - 1;
                swimlaneToUpdateCollection.Add (newSwimlaneToUpdate);
            }
        if (swimlaneToUpdate.SwimlaneOrder > newSwimlaneOrder)
            for (int index = newSwimlaneOrder; index < swimlaneToUpdate.SwimlaneOrder; index++)
            {
                var newSwimlaneToUpdate = DeepCopier.Copy (boardSwimlaneCollection.Single (swimlane => swimlane.SwimlaneOrder == index));
                newSwimlaneToUpdate.SwimlaneOrder = index + 1;
                swimlaneToUpdateCollection.Add (newSwimlaneToUpdate);
            }

        await UpdateSwimlaneBatchAsync (boardSwimlaneCollection);

        return swimlaneToUpdateCollection;
    }

    public async Task<IEnumerable<BoardCard>> FetchAndApplyNewOrderForEffectedBoardCardsAsync (IEnumerable<Swimlane> swimlaneEnumerable, IEnumerable<BoardCard> boardCardEnumerable)
    {
        var effectedBoardCardEnumerable = boardCardEnumerable.Where (boardCard => swimlaneEnumerable.Any (swimlane => swimlane.Title == boardCard.SwimlaneTitle));
        if (effectedBoardCardEnumerable.Count () is not 0)
        {
            foreach (var boardCard in effectedBoardCardEnumerable)
                boardCard.SwimlaneOrder = swimlaneEnumerable.Single (swimlane => swimlane.Title == boardCard.SwimlaneTitle).SwimlaneOrder;

            await _cardRepository.UpdateBoardCardBatchAsync (effectedBoardCardEnumerable); ;
        }

        return effectedBoardCardEnumerable;
    }

    public async Task<Collection<BoardCard>> FetchAndApplyNewTitleForEffectedBoardCardsAsync (Guid boardID, Swimlane swimlaneToDelete)
    {
        var swimlaneToTransferCandidates = await QuerySwimlanesAsync (swimlane => swimlane.RowKey == swimlaneToDelete.RowKey
                                                                            && (swimlane.SwimlaneOrder == swimlaneToDelete.SwimlaneOrder
                                                                                || swimlane.SwimlaneOrder == swimlaneToDelete.SwimlaneOrder - 1));
        if (swimlaneToTransferCandidates.Count () is 0)
            return new Collection<BoardCard> ();
        var swimlaneToTransfer = swimlaneToTransferCandidates.Count is 2 ?
            swimlaneToTransferCandidates.MaxBy (swimlane => swimlane.SwimlaneOrder) :
            swimlaneToTransferCandidates.Single ();

        var boardCardsFromTable = await _cardRepository.QueryBoardCardsAsync (board => board.PartitionKey == boardID.ToString ()
                                                                                       && board.SwimlaneTitle == swimlaneToDelete.Title);
        if (boardCardsFromTable!.Count () is 0)
            return new Collection<BoardCard> ();
        foreach (var boardCard in boardCardsFromTable)
        {
            boardCard.SwimlaneID = Guid.Parse (swimlaneToTransfer!.PartitionKey);
            boardCard.SwimlaneTitle = swimlaneToTransfer!.Title;
            boardCard.SwimlaneOrder = swimlaneToTransfer!.SwimlaneOrder;
        }
        await _cardRepository.UpdateBoardCardBatchAsync (boardCardsFromTable);

        return boardCardsFromTable;
    }

    public async Task<bool> TryRevertEffectedSwimlanesToOriginalAsync (IEnumerable<Swimlane> originalSwimlaneEnumerable)
    {
        try { await UpdateSwimlaneBatchAsync (originalSwimlaneEnumerable); }
        catch (TransactionFailedException)
        { return false; } // Nothing more to do here. We should be more concerned with the failures that led up to this point.

        return true;
    }

    public async Task<bool> TryRevertEffectedBoardCardsToOriginalAsync (IEnumerable<BoardCard> originalBoardCardEnumerable)
    {
        try { await _cardRepository.UpdateBoardCardBatchAsync (originalBoardCardEnumerable); }
        catch (TransactionFailedException)
        { return false; } // Nothing more to do here. We should be more concerned with the failures that led up to this point.

        return true;
    }
}