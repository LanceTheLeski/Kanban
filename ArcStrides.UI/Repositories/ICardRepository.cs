using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;

namespace ArcStrides.UI.Repositories;

public interface ICardRepository
{
    Task<CardPositionResponse?> CreateCardPositionAsync (CardCreateRequest boardCardCreateRequest);

    Task<CardPositionResponse?> UpdateCardPositionAsync (Guid cardID, string boardCardPatchRequest);

    Task DeleteCardAsync (Guid cardID);
}