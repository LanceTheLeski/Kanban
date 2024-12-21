using ArcStrides.API.Models;
using ArcStrides.API.Options;
using ArcStrides.API.Services;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Repositories;

public class CardRepository : ICardRepository
{
    private const string cards = "Cards";
    private const string boardCards = "BoardCards";

    private readonly IAzureTableService<Card> _cardTable;
    private readonly IAzureTableService<BoardCard> _boardCardTable;

    public CardRepository (IOptions<AzureTableOptions> azureTableOptions)
    { 
        _cardTable = new AzureTableService<Card> (cards, azureTableOptions);
        _boardCardTable = new AzureTableService<BoardCard> (boardCards, azureTableOptions);
    }

    public async Task<Card?> GetCardAsync (Guid cardID, Guid tagID)
        => await _cardTable.GetEntityAsync (cardID, tagID);

    public async Task<Collection<Card>> GetCardsAsync (Guid cardID)
        => await _cardTable.GetEntitiesAsync (cardID);

    public async Task AddCardAsync (Card cardToAdd)
        => await _cardTable.AddEntityAsync (cardToAdd);

    public async Task UpdateCardAsync (Card cardToUpdate)
        => await _cardTable.UpdateEntityAsync (cardToUpdate);

    public async Task<Collection<Card>> QueryCardsAsync (Expression<Func<Card, bool>> cardQueryExpression)
        => await _cardTable.QueryEntitiesAsync (cardQueryExpression);

    #region Board Card

    public async Task<BoardCard?> GetBoardCardAsync (Guid boardID, Guid cardID)
        => await _boardCardTable.GetEntityAsync (boardID, cardID);

    public async Task<Collection<BoardCard>> GetBoardCardsAsync (Guid boardID)
        => await _boardCardTable.GetEntitiesAsync (boardID);

    public async Task<Collection<BoardCard>> QueryBoardCardsAsync (Expression<Func<BoardCard, bool>> boardCardQueryExpression)
        => await _boardCardTable.QueryEntitiesAsync (boardCardQueryExpression);

    public async Task AddBoardCardAsync (BoardCard boardCardToAdd)
        => await _boardCardTable.AddEntityAsync (boardCardToAdd);

    public async Task UpdateBoardCardAsync (BoardCard boardCardToUpdate)
        => await _boardCardTable.UpdateEntityAsync (boardCardToUpdate);

    public async Task UpdateBoardCardBatchAsync (IEnumerable<BoardCard> boardCardBatch)
        => await _boardCardTable.UpdateEntityBatchAsync (boardCardBatch);

    public async Task DeleteBoardCardAsync (BoardCard boardCardToDelete)
        => await _boardCardTable.DeleteEntityAsync (boardCardToDelete);

    #endregion Board Card
}