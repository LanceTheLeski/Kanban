using ArcStrides.Contracts.Response;

namespace ArcStrides.UI.Repositories;

public interface IBoardRepository
{
    Task<BoardResponse> FetchBoard (Guid boardID);
}