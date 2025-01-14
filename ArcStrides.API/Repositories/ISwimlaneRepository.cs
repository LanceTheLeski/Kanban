using ArcStrides.API.Models.Board;
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

    Task<IEnumerable<CardPosition>> FetchAndApplyNewOrderForEffectedBoardCardsAsync (IEnumerable<Swimlane> swimlaneEnumerable, IEnumerable<CardPosition> boardCardEnumerable);

    Task<Collection<CardPosition>> FetchAndApplyNewTitleForEffectedBoardCardsAsync (Guid boardID, Swimlane swimlaneToDelete);

    Task<bool> TryRevertEffectedSwimlanesToOriginalAsync (IEnumerable<Swimlane> originalSwimlaneEnumerable);

    Task<bool> TryRevertEffectedBoardCardsToOriginalAsync (IEnumerable<CardPosition> originalBoardCardEnumerable);
}