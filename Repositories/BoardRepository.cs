using Azure.Data.Tables;
using Kanban.Components.DTOs;
using Kanban.Contexts;
using Kanban.Models;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.Extensions.Options;
using System;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.Repositories;

public class BoardRepository
{
    private const string boards = "Boards";
    private const string columns = "Columns";
    private const string swimlanes = "Swimlanes";
    private const string cards = "Cards";
    private const string tags = "Tags";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _boardTable;
    private readonly TableClient _columnTable;
    private readonly TableClient _swimlaneTable;
    private readonly TableClient _cardTable;
    private readonly TableClient _tagTable;

    public BoardRepository (IOptions<CosmosOptions> cosmosOptions)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _boardTable = _tableServiceClient.GetTableClient (tableName: boards);
        _columnTable = _tableServiceClient.GetTableClient (tableName: columns);
        _swimlaneTable = _tableServiceClient.GetTableClient (tableName: swimlanes);
        _cardTable = _tableServiceClient.GetTableClient (tableName: cards);
        _tagTable = _tableServiceClient.GetTableClient (tableName: tags);
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

        var boardsFromTable = _boardTable.QueryAsync (boardQueryExpression);
        await foreach (var board in boardsFromTable)
            boardCollection.Add (board);

        return boardCollection;
    }
}