namespace Kanban.API.Repositories;

using Azure.Data.Tables;
using Kanban.API.Models;
using Kanban.API.Options;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

public class CardRepository : ICardRepository
{
    private const string cards = "Cards";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _cardTable;

    public CardRepository (IOptions<CosmosOptions> cosmosOptions)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _cardTable = _tableServiceClient.GetTableClient (tableName: cards);
    }

    public async Task<Card?> GetCardAsync (Guid cardID, Guid tagID)
    {
        var response = await _cardTable.GetEntityAsync<Card> (partitionKey: cardID.ToString (), rowKey: tagID.ToString ());
        return response?.Value.GetType () == typeof (Card) ?
            response.Value :
            null;
    }

    public async Task<Azure.Response> UpdateCardAsync (Tag cardToUpdate)
        => await _cardTable.UpdateEntityAsync (cardToUpdate, Azure.ETag.All);

    public async Task<Collection<Card>> QueryCardsAsync (Expression<Func<Card, bool>> cardQueryExpression)
    {
        var cardCollection = new Collection<Card> ();

        var cardsFromTable = _cardTable.QueryAsync (cardQueryExpression); //This seems to fail with certain expressions
        await foreach (var card in cardsFromTable)
            cardCollection.Add (card);

        return cardCollection;
    }
}