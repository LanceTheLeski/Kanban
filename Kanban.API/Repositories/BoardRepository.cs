using Azure.Data.Tables;
using Kanban.API.Models;
using Kanban.API.Options;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public class BoardRepository : IBoardRepository
{
    private const string boards = "Boards";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _boardTable;

    public BoardRepository (IOptions<CosmosOptions> cosmosOptions)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _boardTable = _tableServiceClient.GetTableClient (tableName: boards);
    }

    public async Task<Board?> GetBoardCardAsync (Guid boardID, Guid cardID)
    {
        var response = await _boardTable.GetEntityAsync<Board> (partitionKey: boardID.ToString (), rowKey: cardID.ToString ());
        return response?.Value.GetType () == typeof (Board) ?
            response.Value :
            null;
    }

    public async Task<Azure.Response> UpdateBoardCardAsync (Board boardToUpdate)
        => await _boardTable.UpdateEntityAsync (boardToUpdate, Azure.ETag.All);

    public async Task<Collection<Board>> QueryBoardsAsync (Expression<Func<Board, bool>> boardQueryExpression)
    {
        var boardCollection = new Collection<Board> ();

        var boardsFromTable = _boardTable.QueryAsync (boardQueryExpression); //This seems to fail with certain expressions
        await foreach (var board in boardsFromTable)
            boardCollection.Add (board);

        return boardCollection;
    }

    public async Task UpdateBoardCardBatchAsync (IEnumerable<Board> boardCardCollection)
    {
        Collection<TableTransactionAction> columnTableTransaction = new Collection<TableTransactionAction> ();
        foreach (var boardCard in boardCardCollection)
            columnTableTransaction.Add (new (TableTransactionActionType.UpdateMerge, boardCard));

        var transactionResponse = await _boardTable.SubmitTransactionAsync (columnTableTransaction);
        if (transactionResponse.GetRawResponse ().IsError)
            throw new Exception ("We could not update cards with new column data.");
    }
}