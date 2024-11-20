using Kanban.API.Helpers;
using Kanban.API.Models;
using Kanban.API.Options;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public class TagGroupRepository : EntityRepository<TagGroup>, ITagGroupRepository
{
    private const string tagGroups = "TagGroups";

    public TagGroupRepository (IOptions<CosmosOptions> cosmosOptions) 
        : base (tagGroups, cosmosOptions) 
    { }

    public async Task<TagGroup?> GetTagGroupAsync (Guid tagGroupID, Guid tagID)
        => await GetEntityAsync (tagGroupID, tagID);

    public async Task<Azure.Response> UpdateTagGroupAsync (TagGroup tagGroupToUpdate)
        => await UpdateEntityAsync (tagGroupToUpdate);

    public async Task<Collection<TagGroup>> QueryTagGroupsAsync (Expression<Func<TagGroup, bool>> tagGroupQueryExpression)
        => await QueryEntitiesAsync (tagGroupQueryExpression);
}