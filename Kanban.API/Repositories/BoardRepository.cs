using Azure.Data.Tables;
using Kanban.API.Helpers;
using Kanban.API.Models;
using Kanban.API.Options;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace Kanban.API.Repositories;

public class BoardRepository : EntityRepository<BoardCard>, IBoardRepository
{
    private const string boards = "Boards";

    public BoardRepository (IOptions<CosmosOptions> cosmosOptions) 
        : base (boards, cosmosOptions)
    { }

    public async Task<BoardCard?> GetBoardCardAsync (Guid boardID, Guid cardID)
        => await GetEntityAsync (boardID, cardID);

    public async Task<Azure.Response> UpdateBoardCardAsync (BoardCard boardToUpdate)
        => await UpdateEntityAsync (boardToUpdate);

    public async Task<Collection<BoardCard>> QueryBoardsAsync (Expression<Func<BoardCard, bool>> boardQueryExpression)
        => await QueryEntitiesAsync (boardQueryExpression);

    public async Task UpdateBoardCardBatchAsync (IEnumerable<BoardCard> boardCardCollection)
    {
        Collection<TableTransactionAction> columnTableTransaction = new Collection<TableTransactionAction> ();
        foreach (var boardCard in boardCardCollection)
            columnTableTransaction.Add (new (TableTransactionActionType.UpdateMerge, boardCard));

        var transactionResponse = await _table.SubmitTransactionAsync (columnTableTransaction);
        if (transactionResponse.GetRawResponse ().IsError)
            throw new Exception ("We could not update cards with new column data.");
    }
}