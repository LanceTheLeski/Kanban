using ArcStrides.Contracts.Response;

namespace ArcStrides.UI.Repositories;

public interface IBoardRepository
{
    Task<BoardResponse?> FetchBoardAsync (Guid boardID);
}