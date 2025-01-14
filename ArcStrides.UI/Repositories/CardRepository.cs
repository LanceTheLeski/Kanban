using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Options;
using ArcStrides.UI.Services;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace ArcStrides.UI.Repositories;

public class CardRepository : ICardRepository
{
    private readonly ArcStridesServiceOptions _backendOptions;

    private readonly IArcStridesService<CardPositionResponse> _arcStridesBackend;

    public CardRepository (IOptions<ArcStridesServiceOptions> backendOptions,
                           IArcStridesService<CardPositionResponse> arcStridesBackend)
    {
        _backendOptions = backendOptions.Value;

        _arcStridesBackend = arcStridesBackend;
    }

    public async Task<CardPositionResponse?> CreateCard (CardCreateRequest boardCardCreateRequest)
        => await _arcStridesBackend.CreateEntityAsync (@$"{_backendOptions.URL}arcstrides/cards", JsonConvert.SerializeObject (boardCardCreateRequest));

    public async Task<CardPositionResponse?> UpdateCard (Guid cardID, string boardCardPatchRequest)
        => await _arcStridesBackend.UpdateEntityAsync (@$"{_backendOptions.URL}arcstrides/cards/{cardID}", boardCardPatchRequest);

    public async Task DeleteCard (Guid cardID)
        => await _arcStridesBackend.DeleteEntityAsync (@$"{_backendOptions.URL}arcstrides/boards/{cardID}");
}