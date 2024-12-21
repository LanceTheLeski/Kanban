using ArcStrides.Contracts.Response;

namespace ArcStrides.UI.Services;

public interface IBoardService
{
    Task<BoardResponse> FetchBoard (Guid boardID);
}