using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Services;
using Newtonsoft.Json;

namespace ArcStrides.UI.Repositories;

public class CardRepository : ICardRepository
{
    private readonly IArcStridesService<CardPositionResponse> _arcStridesBackend;

    public CardRepository (IArcStridesService<CardPositionResponse> arcStridesBackend)
    {
        _arcStridesBackend = arcStridesBackend;
    }

    public async Task<CardPositionResponse?> CreateCardPositionAsync (CardCreateRequest cardPositionCreateRequest)
        => await _arcStridesBackend.CreateEntityAsync (@$"arcstrides/cards", JsonConvert.SerializeObject (cardPositionCreateRequest));

    public async Task<CardPositionResponse?> UpdateCardPositionAsync (Guid cardID, string cardPositionPatchRequest)
        => await _arcStridesBackend.UpdateEntityAsync (@$"arcstrides/cards/{cardID}", cardPositionPatchRequest);

    public async Task DeleteCardPositionAsync (Guid cardID)
        => await _arcStridesBackend.DeleteEntityAsync (@$"arcstrides/boards/{cardID}");
}