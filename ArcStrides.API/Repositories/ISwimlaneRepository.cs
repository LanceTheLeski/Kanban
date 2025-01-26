using ArcStrides.API.Models.Board;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Repositories;

public interface ISwimlaneRepository
{
    Task<Swimlane?> GetSwimlaneAsync (Guid swimlaneID, Guid boardID);

    Task<Collection<Swimlane>> GetAllBoardSwimlanes (Guid boardID);

    Task<Collection<Swimlane>> QuerySwimlanesAsync (Expression<Func<Swimlane, bool>> swimlaneQueryExpression);

    Task AddSwimlaneAsync (Swimlane swimlaneToAdd);

    Task UpdateSwimlaneBatchAsync (IEnumerable<Swimlane> swimlaneBatchToUpdate);

    Task DeleteSwimlaneAsync (Swimlane swimlaneToDelete);

    Task<bool> SubmitArcTransactionAsync (ArcTransaction arcTransaction);

    ArcTransaction IncrementExistingSwimlanesOrder (IEnumerable<Swimlane> swimlaneEnumerableToUpdate, ArcTransaction arcTransaction);

    ArcTransaction DecrementExistingSwimlanesOrder (IEnumerable<Swimlane> swimlaneEnumerableToUpdate, ArcTransaction arcTransaction);

    ArcTransaction ApplyNewOrderForExistingSwimlanes (Swimlane swimlaneToUpdate, int newSwimlaneOrder, IEnumerable<Swimlane> boardSwimlaneEnumerable, ArcTransaction arcTransaction);

    ArcTransaction ApplyNewOrderForExistingCardPositions (IEnumerable<Swimlane> swimlaneEnumerable, IEnumerable<CardPosition> boardCardEnumerable, ArcTransaction arcTransaction);

    ArcTransaction ApplyNewTitleAndOrderForExistingCardPositions (Swimlane swimlaneToDelete, IEnumerable<Swimlane> swimlaneEnumerable, IEnumerable<CardPosition> cardPositionEnumerable, ArcTransaction arcTransaction);
}