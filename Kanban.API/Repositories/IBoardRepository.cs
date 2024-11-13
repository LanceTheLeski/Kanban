using Kanban.API.Models;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace Kanban.API.Repositories;

public interface IBoardRepository
{
    public Task<BoardCard?> GetBoardCardAsync (Guid boardID, Guid cardID);

    public Task<Azure.Response> UpdateBoardCardAsync (BoardCard boardToUpdate);

    public Task<Collection<BoardCard>> QueryBoardsAsync (Expression<Func<BoardCard, bool>> boardQueryExpression);

    public Task UpdateBoardCardBatchAsync (IEnumerable<BoardCard> boardCardCollection);
}