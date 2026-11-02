using ArcStrides.Contracts.Response;

namespace ArcStrides.UI.Repositories;

public interface ITagRepository
{
    Task<List<TagGroupResponse>?> FetchTagGroupsAsync ();
}