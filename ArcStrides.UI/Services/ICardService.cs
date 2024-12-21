using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;

namespace ArcStrides.UI.Services;

public interface ICardService
{
    Task<BoardCardResponse?> CreateCard (CardCreateRequest boardCardCreateRequest);

    Task<BoardCardResponse?> UpdateCard (Guid cardID, string boardCardPatchRequest);

    Task<bool> DeleteCard (Guid cardID);
}