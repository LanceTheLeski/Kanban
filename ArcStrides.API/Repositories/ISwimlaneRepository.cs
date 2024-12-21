using ArcStrides.API.Models;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Repositories;

public interface ISwimlaneRepository
{
    Task<Swimlane?> GetSwimlaneAsync (Guid swimlaneID, Guid boardID);

    Task<Collection<Swimlane>> GetSwimlanesAsync (Guid swimlaneID);

    Task<Collection<Swimlane>> GetAllBoardSwimlanes (Guid boardID);

    Task<Collection<Swimlane>> QuerySwimlanesAsync (Expression<Func<Swimlane, bool>> swimlaneQueryExpression);

    Task AddSwimlaneAsync (Swimlane swimlaneToAdd);

    Task UpdateSwimlaneBatchAsync (IEnumerable<Swimlane> swimlaneBatchToUpdate);

    Task DeleteSwimlaneAsync (Swimlane swimlaneToDelete);

    IList<Swimlane> IncrementExistingSwimlanesOrder (IList<Swimlane> swimlaneCollectionWithNewSwimlaneToUpdateOrder, Swimlane newSwimlane);

    ICollection<Swimlane> DecrementExistingSwimlanesOrder (ICollection<Swimlane> swimlaneCollectionToUpdate);

    Task<Collection<Swimlane>> FetchAndApplyNewOrderForEffectedSwimlanesAsync (Swimlane swimlaneToUpdate, int newSwimlaneOrder);

    Task<IEnumerable<BoardCard>> FetchAndApplyNewOrderForEffectedBoardCardsAsync (IEnumerable<Swimlane> swimlaneEnumerable, IEnumerable<BoardCard> boardCardEnumerable);

    Task<Collection<BoardCard>> FetchAndApplyNewTitleForEffectedBoardCardsAsync (Guid boardID, Swimlane swimlaneToDelete);

    Task<bool> TryRevertEffectedSwimlanesToOriginalAsync (IEnumerable<Swimlane> originalSwimlaneEnumerable);

    Task<bool> TryRevertEffectedBoardCardsToOriginalAsync (IEnumerable<BoardCard> originalBoardCardEnumerable);
}