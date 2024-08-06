using Kanban.Contracts.Request.Patch;
using Kanban.API.Models;
using Microsoft.AspNetCore.JsonPatch;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace Kanban.API.Repositories;

public interface ISwimlaneRepository
{
    public Task<Collection<Swimlane>> GetAllSwimlanesForBoard (Guid boardID);

    public Task<Swimlane?> GetSwimlaneAsync (Guid swimlaneID, Guid boardID);

    public Task<Collection<Swimlane>> QuerySwimlanesAsync (Expression<Func<Swimlane, bool>> swimlaneQueryExpression);

    public SwimlanePatchRequest ApplyJsonPatchDocumentToSwimlane (JsonPatchDocument<SwimlanePatchRequest> swimlanePatchRequest, Swimlane swimlaneToUpdate);

    public Collection<Swimlane> ApplyAllOtherSwimlaneOrdersAsync (Collection<Swimlane> swimlaneCollection, int oldSwimlaneOrder, int newSwimlaneOrder);

    public Task UpdateSwimlaneBatchAndTheirBoardCardsAsync (Collection<Swimlane> swimlaneCollection);

    public Task UpdateSwimlaneToDeleteBordCardBatchAsync (Swimlane swimlaneToDelete, Swimlane swimlaneForTransfer);

    public (int oldOrder, int newOrder) GetSwimlaneOrderChange (Swimlane swimlaneBeforeUpdate, SwimlanePatchRequest swimlaneAfterUpdate);
}