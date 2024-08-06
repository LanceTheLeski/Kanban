using Kanban.API.Models;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace Kanban.API.Repositories;

public interface IBoardRepository
{
    public Task<Board?> GetBoardCardAsync (Guid boardID, Guid cardID);

    public Task<Azure.Response> UpdateBoardCardAsync (Board boardToUpdate);

    public Task<Collection<Board>> QueryBoardsAsync (Expression<Func<Board, bool>> boardQueryExpression);

    public Task UpdateBoardCardBatchAsync (IEnumerable<Board> boardCardCollection);
}