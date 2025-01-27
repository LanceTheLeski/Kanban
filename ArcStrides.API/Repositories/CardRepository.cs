using ArcStrides.API.Models.Board;
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
    private const string cardPositions = "CardPosition";

    private readonly IAzureTableService<Card> _cardTable;
    private readonly IAzureTableService<CardPosition> _cardPositionTable;

    public CardRepository (IOptions<AzureTableOptions> azureTableOptions)
    { 
        _cardTable = new AzureTableService<Card> (cards, azureTableOptions);
        _cardPositionTable = new AzureTableService<CardPosition> (cardPositions, azureTableOptions);
    }

    public async Task<Card?> GetCardAsync (Guid boardID, Guid cardID)
        => await _cardTable.GetEntityAsync (boardID, cardID);

    public async Task<Collection<Card>> GetCardsAsync (Guid boardID)
        => await _cardTable.GetEntitiesAsync (boardID);

    public async Task AddCardAsync (Card cardToAdd)
        => await _cardTable.AddEntityAsync (cardToAdd);

    public async Task UpdateCardAsync (Card cardToUpdate)
        => await _cardTable.UpdateEntityAsync (cardToUpdate);

    public async Task<Collection<Card>> QueryCardsAsync (Expression<Func<Card, bool>> cardQueryExpression)
        => await _cardTable.QueryEntitiesAsync (cardQueryExpression);

    #region Card Position

    public async Task<CardPosition?> GetCardPositionAsync (Guid boardID, Guid cardPositionID)
        => await _cardPositionTable.GetEntityAsync (boardID, cardPositionID);

    public async Task<Collection<CardPosition>> GetCardPositionsAsync (Guid boardID)
        => await _cardPositionTable.GetEntitiesAsync (boardID);

    public async Task<Collection<CardPosition>> QueryCardPositionsAsync (Expression<Func<CardPosition, bool>> boardCardQueryExpression)
        => await _cardPositionTable.QueryEntitiesAsync (boardCardQueryExpression);

    public async Task AddCardPositionAsync (CardPosition boardCardToAdd)
        => await _cardPositionTable.AddEntityAsync (boardCardToAdd);

    public async Task UpdateCardPositionAsync (CardPosition boardCardToUpdate)
        => await _cardPositionTable.UpdateEntityAsync (boardCardToUpdate);

    public async Task UpdateCardPositionBatchAsync (IEnumerable<CardPosition> boardCardBatch)
        => await _cardPositionTable.UpdateEntityBatchAsync (boardCardBatch);

    public async Task DeleteCardPositionAsync (CardPosition boardCardToDelete)
        => await _cardPositionTable.DeleteEntityAsync (boardCardToDelete);

    #endregion Card Position
}