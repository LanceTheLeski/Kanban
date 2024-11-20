using Kanban.API.Models;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public interface ICardRepository
{
    public Task<Card?> GetCardAsync (Guid cardID, Guid tagID);

    public Task<Azure.Response> UpdateCardAsync (Card cardToUpdate);

    public Task<Collection<Card>> QueryCardsAsync (Expression<Func<Card, bool>> cardQueryExpression);
}