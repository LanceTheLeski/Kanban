using ArcStrides.API.Models.Board;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Repositories;

public interface ICardRepository
{
    #region Card

    Task<Card?> GetCardAsync (Guid cardID, Guid tagID);

    Task<Collection<Card>> GetCardsAsync (Guid cardID);

    Task<Collection<Card>> QueryCardsAsync (Expression<Func<Card, bool>> cardQueryExpression);

    Task AddCardAsync (Card cardToAdd);

    Task UpdateCardAsync (Card cardToUpdate);

    #endregion Card

    #region Card Position

    Task<CardPosition?> GetCardPositionAsync (Guid boardID, Guid cardID);

    Task<Collection<CardPosition>> GetCardPositionsAsync (Guid boardID);

    Task<Collection<CardPosition>> QueryCardPositionsAsync (Expression<Func<CardPosition, bool>> boardCardQueryExpression);

    Task AddCardPositionAsync (CardPosition boardCardToAdd);

    Task UpdateCardPositionAsync (CardPosition boardCardToUpdate);

    Task UpdateCardPositionBatchAsync (IEnumerable<CardPosition> boardCardCollection);

    Task DeleteCardPositionAsync (CardPosition boardCardToDelete);

    #endregion Card Position
}