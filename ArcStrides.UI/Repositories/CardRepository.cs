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

    public async Task<CardPositionResponse?> CreateCardPositionAsync (Guid boardID, CardCreateRequest cardPositionCreateRequest)
        => await _arcStridesBackend.CreateEntityAsync (@$"arcstrides/boards/{boardID}/cards", JsonConvert.SerializeObject (cardPositionCreateRequest));

    public async Task<CardPositionResponse?> UpdateCardPositionAsync (Guid boardID, Guid cardPositionID, string cardPositionPatchRequest)
        => await _arcStridesBackend.UpdateEntityAsync (@$"arcstrides/boards/{boardID}/cards/positions/{cardPositionID}", cardPositionPatchRequest);

    public async Task DeleteCardAsync (Guid cardID)
        => await _arcStridesBackend.DeleteEntityAsync (@$"arcstrides/boards/{cardID}");
}