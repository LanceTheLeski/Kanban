using ArcStrides.API.Models;
using ArcStrides.API.Models.Board;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Repositories;

public interface IColumnRepository
{
    Task<Column?> GetColumnAsync (Guid boardID, Guid columnID);

    Task<Collection<Column>> GetAllBoardColumns (Guid boardID);

    Task<Collection<Column>> QueryColumnsAsync (Expression<Func<Column, bool>> columnQueryExpression);

    Task AddColumnAsync (Column columnToAdd);

    Task UpdateColumnBatchAsync (IEnumerable<Column> columnBatchToUpdate);

    Task DeleteColumnAsync (Column columnToDelete);

    Task<bool> SubmitArcTransactionAsync (ArcTransaction arcTransaction);

    ArcTransaction IncrementExistingColumnsOrder (IEnumerable<Column> columnEnumerableToUpdate, ArcTransaction arcTransaction);

    ArcTransaction DecrementExistingColumnsOrder (IEnumerable<Column> columnEnumerableToUpdate, ArcTransaction arcTransaction);

    ArcTransaction ApplyNewOrderForExistingColumns (Column columnToUpdate, int newColumnOrder, IEnumerable<Column> boardColumnEnumerable, ArcTransaction arcTransaction);

    ArcTransaction ApplyNewOrderForExistingCardPositions (IEnumerable<Column> columnEnumerable, IEnumerable<CardPosition> boardCardEnumerable, ArcTransaction arcTransaction);

    ArcTransaction ApplyNewTitleAndOrderForExistingCardPositions (Column columnToDelete, IEnumerable<Column> columnEnumerable, IEnumerable<CardPosition> cardPositionEnumerable, ArcTransaction arcTransaction);
}