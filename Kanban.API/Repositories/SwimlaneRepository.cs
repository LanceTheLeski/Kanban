using Azure.Data.Tables;
using Kanban.Contracts.Request.Patch;
using Kanban.API.Models;
using Kanban.API.Options;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace Kanban.API.Repositories;

public class SwimlaneRepository : ISwimlaneRepository
{
    private const string swimlanes = "Swimlanes";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _swimlaneTable;

    private readonly IBoardRepository _boardRepository;

    public SwimlaneRepository (IOptions<CosmosOptions> cosmosOptions,
                               IBoardRepository boardRepository)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _swimlaneTable = _tableServiceClient.GetTableClient (tableName: swimlanes);

        _boardRepository = boardRepository;
    }

    public async Task<Collection<Swimlane>> GetAllSwimlanesForBoard (Guid boardID)
    {
        var swimlaneCollection = new Collection<Swimlane> ();

        var swimlanesFromTable = _swimlaneTable.QueryAsync<Swimlane> (swimlane => swimlane.RowKey == boardID.ToString ());
        await foreach (var swimlane in swimlanesFromTable)
            swimlaneCollection.Add (swimlane);

        return swimlaneCollection;
    }

    public async Task<Swimlane?> GetSwimlaneAsync (Guid swimlaneID, Guid boardID)
    {
        var response = await _swimlaneTable.GetEntityAsync<Swimlane> (partitionKey: swimlaneID.ToString (), rowKey: boardID.ToString ());
        return response?.Value.GetType () == typeof (Swimlane) ?
            response.Value :
            null;
    }

    public async Task<Collection<Swimlane>> QuerySwimlanesAsync (Expression<Func<Swimlane, bool>> swimlaneQueryExpression)
    {
        var swimlaneCollection = new Collection<Swimlane> ();

        var swimlanesFromTable = _swimlaneTable.QueryAsync (swimlaneQueryExpression);
        await foreach (var swimlane in swimlanesFromTable)
            swimlaneCollection.Add (swimlane);

        return swimlaneCollection;
    }

    public SwimlanePatchRequest ApplyJsonPatchDocumentToSwimlane (JsonPatchDocument<SwimlanePatchRequest> swimlanePatchRequest, Swimlane swimlaneToUpdate)
    {
        var convertedSwimlaneToUpdate = new SwimlanePatchRequest
        {
            Title = swimlaneToUpdate.Title,
            Order = swimlaneToUpdate.SwimlaneOrder
        };

        swimlanePatchRequest.ApplyTo (convertedSwimlaneToUpdate);

        return convertedSwimlaneToUpdate;
    }

    public Collection<Swimlane> ApplyAllOtherSwimlaneOrdersAsync (Collection<Swimlane> swimlaneCollection, int oldSwimlaneOrder, int newSwimlaneOrder)
    {
        if (oldSwimlaneOrder == newSwimlaneOrder)
            throw new Exception ("Don't pass the same swimlane order..");

        var swimlanesToUpdate = new Collection<Swimlane> ();
        if (oldSwimlaneOrder < newSwimlaneOrder)
            for (int index = oldSwimlaneOrder + 1; index <= newSwimlaneOrder; index ++)
            {
                var swimlaneToUpdate = swimlaneCollection.Single (swimlane => swimlane.SwimlaneOrder == index).DeepCopy ();
                swimlaneToUpdate.SwimlaneOrder = index - 1;
                swimlanesToUpdate.Add (swimlaneToUpdate);
            }
        if (oldSwimlaneOrder > newSwimlaneOrder)
            for (int index = newSwimlaneOrder; index < oldSwimlaneOrder; index++)
            {
                var swimlaneToUpdate = swimlaneCollection.Single (swimlane => swimlane.SwimlaneOrder == index).DeepCopy ();
                swimlaneToUpdate.SwimlaneOrder = index + 1;
                swimlanesToUpdate.Add (swimlaneToUpdate);
            }

        return swimlanesToUpdate;
    }

    public async Task UpdateSwimlaneBatchAndTheirBoardCardsAsync (Collection<Swimlane> swimlaneCollection)
    {
        if (swimlaneCollection.Count is 0)
            return;

        var boardCardsFromTable = await _boardRepository.QueryBoardsAsync (board => board.PartitionKey == @"20a88077-10d4-4648-92cb-7dc7ba5b8df5");
        var filteredBoardCardsFromTable = boardCardsFromTable.Where (boardCard => swimlaneCollection.Any (swimlane => swimlane.Title == boardCard.SwimlaneTitle));
        if (filteredBoardCardsFromTable is not null || filteredBoardCardsFromTable!.Count () is not 0)
        {
            foreach (var boardCard in filteredBoardCardsFromTable)
                boardCard.SwimlaneOrder = swimlaneCollection.FirstOrDefault (swimlane => swimlane.Title == boardCard.SwimlaneTitle)!.SwimlaneOrder;
            await _boardRepository.UpdateBoardCardBatchAsync (filteredBoardCardsFromTable);
        }

        await UpdateSwimlaneBatchAsync (swimlaneCollection);
    }

    public async Task UpdateSwimlaneToDeleteBordCardBatchAsync (Swimlane swimlaneToDelete, Swimlane swimlaneForTransfer)
    {
        var boardCardsFromTable = await _boardRepository.QueryBoardsAsync (board => board.PartitionKey == @"20a88077-10d4-4648-92cb-7dc7ba5b8df5"
                                                                                    && board.SwimlaneTitle == swimlaneToDelete.Title);
        if (boardCardsFromTable is null || boardCardsFromTable!.Count () is 0)
            return;

        foreach (var boardCard in boardCardsFromTable)
        {
            boardCard.SwimlaneID = Guid.Parse (swimlaneForTransfer.PartitionKey);
            boardCard.SwimlaneTitle = swimlaneForTransfer.Title;
            boardCard.SwimlaneOrder = swimlaneForTransfer.SwimlaneOrder;
        }
        await _boardRepository.UpdateBoardCardBatchAsync (boardCardsFromTable);
    }

    public async Task UpdateSwimlaneBatchAsync (Collection<Swimlane> swimlaneCollection)
    {
        foreach (var swimlane in swimlaneCollection)
        {
            var response = await _swimlaneTable.UpdateEntityAsync (swimlane, Azure.ETag.All);
            if (response.IsError)
                throw new Exception ($"Update error: {response.ReasonPhrase}");
        }
    }

    public (int oldOrder, int newOrder) GetSwimlaneOrderChange (Swimlane swimlaneBeforeUpdate, SwimlanePatchRequest swimlaneAfterUpdate)
    {
        int oldOrder = swimlaneBeforeUpdate.SwimlaneOrder;
        int newOrder = swimlaneAfterUpdate.Order;
        return (oldOrder, newOrder);
    }
}