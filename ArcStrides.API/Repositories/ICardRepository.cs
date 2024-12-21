using ArcStrides.API.Models;
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

    #region Board Card

    Task<BoardCard?> GetBoardCardAsync (Guid boardID, Guid cardID);

    Task<Collection<BoardCard>> GetBoardCardsAsync (Guid boardID);

    Task<Collection<BoardCard>> QueryBoardCardsAsync (Expression<Func<BoardCard, bool>> boardCardQueryExpression);

    Task AddBoardCardAsync (BoardCard boardCardToAdd);

    Task UpdateBoardCardAsync (BoardCard boardCardToUpdate);

    Task UpdateBoardCardBatchAsync (IEnumerable<BoardCard> boardCardCollection);

    Task DeleteBoardCardAsync (BoardCard boardCardToDelete);

    #endregion Board Card
}