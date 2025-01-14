using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;

namespace ArcStrides.UI.Repositories;

public interface ICardRepository
{
    Task<CardPositionResponse?> CreateCard (CardCreateRequest boardCardCreateRequest);

    Task<CardPositionResponse?> UpdateCard (Guid cardID, string boardCardPatchRequest);

    Task DeleteCard (Guid cardID);
}