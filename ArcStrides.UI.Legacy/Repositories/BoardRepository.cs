using ArcStrides.Contracts.Response;
using ArcStrides.UI.Services;

namespace ArcStrides.UI.Repositories;

public class BoardRepository : IBoardRepository
{
    private readonly IArcStridesService<BoardResponse> _arcStridesBackend;

    public BoardRepository (IArcStridesService<BoardResponse> arcStridesBacken)
    {
        _arcStridesBackend = arcStridesBacken;
    }

    public async Task<BoardResponse?> FetchBoardAsync (Guid boardID)
        => await _arcStridesBackend.FetchEntityAsync ($"arcstrides/boards/{boardID}");
}