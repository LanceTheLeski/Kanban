using ArcStrides.API.Models;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Repositories;

public interface IColumnRepository
{
    Task<Column?> GetColumnAsync (Guid columnID, Guid boardID);

    Task<Collection<Column>> GetColumnsAsync (Guid columnID);

    Task<Collection<Column>> GetAllBoardColumns (Guid boardID);

    Task<Collection<Column>> QueryColumnsAsync (Expression<Func<Column, bool>> columnQueryExpression);

    Task AddColumnAsync (Column columnToAdd);

    Task UpdateColumnBatchAsync (IEnumerable<Column> columnBatchToUpdate);

    Task DeleteColumnAsync (Column columnToDelete);

    IList<Column> IncrementExistingColumnsOrder (IList<Column> columnCollectionWithNewColumnToUpdateOrder, Column newColumn);

    ICollection<Column> DecrementExistingColumnsOrder (ICollection<Column> columnCollectionToUpdate);

    Task<Collection<Column>> FetchAndApplyNewOrderForEffectedColumnsAsync (Column columnToUpdate, int newColumnOrder);

    Task<IEnumerable<BoardCard>> FetchAndApplyNewOrderForEffectedBoardCardsAsync (IEnumerable<Column> columnEnumerable, IEnumerable<BoardCard> boardCardEnumerable);

    Task<Collection<BoardCard>> FetchAndApplyNewTitleForEffectedBoardCardsAsync (Guid boardID, Column columnToDelete);

    Task<bool> TryRevertEffectedColumnsToOriginalAsync (IEnumerable<Column> originalColumnEnumerable);

    Task<bool> TryRevertEffectedBoardCardsToOriginalAsync (IEnumerable<BoardCard> originalBoardCardEnumerable);
}