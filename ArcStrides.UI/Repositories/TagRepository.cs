using ArcStrides.Contracts.Response;
using ArcStrides.UI.Services;

namespace ArcStrides.UI.Repositories;

public class TagRepository : ITagRepository
{
    private readonly IArcStridesService<TagResponse> _arcStridesTagBackend;
    private readonly IArcStridesService<TagGroupResponse> _arcStridesTagGroupBackend;

    public TagRepository (IArcStridesService<TagResponse> arcStridesTagBackend,
                          IArcStridesService<TagGroupResponse> arcStridesTagGroupBackend)
    {
        _arcStridesTagBackend = arcStridesTagBackend;
        _arcStridesTagGroupBackend = arcStridesTagGroupBackend;
    }

    public async Task<List<TagGroupResponse>?> FetchTagGroupsAsync ()
        => await _arcStridesTagGroupBackend.FetchEntitiesAsync ($"arcstrides/tags/groups");
}