using Azure.Data.Tables;
using Kanban.API.Components;
using Kanban.API.Models;
using Kanban.API.Options;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public class CardRepository : EntityRepository<Card>, ICardRepository
{
    private const string cards = "Cards";

    public CardRepository (IOptions<CosmosOptions> cosmosOptions) 
                            : base (cards, cosmosOptions)
    { }

    public async Task<Card?> GetCardAsync (Guid cardID, Guid tagID)
        => await GetEntityAsync (cardID, tagID);

    public async Task<Azure.Response> UpdateCardAsync (Card cardToUpdate)
        => await UpdateEntityAsync (cardToUpdate);

    public async Task<Collection<Card>> QueryCardsAsync (Expression<Func<Card, bool>> cardQueryExpression)
        => await QueryCardsAsync (cardQueryExpression);
}