using Kanban.API.Helpers;
using Kanban.API.Models;
using Kanban.API.Options;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public class TagGroupTypeRepository : EntityRepository<TagGroupType>, ITagGroupTypeRepository
{

    private const string tagGroupTypes = "TagGroupTypes";

    public TagGroupTypeRepository (IOptions<CosmosOptions> cosmosOptions)
        : base (tagGroupTypes, cosmosOptions)
    { }

    public async Task<TagGroupType?> GetTagGroupTypeAsync (Guid tagGroupTypeID, Guid tagGroupID)
        => await GetEntityAsync (tagGroupTypeID, tagGroupID);

    public async Task<Azure.Response> UpdateTagGroupTypeAsync (TagGroupType tagGroupTypeToUpdate)
        => await UpdateEntityAsync (tagGroupTypeToUpdate);

    public async Task<Collection<TagGroupType>> QueryTagGroupTypesAsync (Expression<Func<TagGroupType, bool>> tagGroupTypeQueryExpression)
        => await QueryEntitiesAsync (tagGroupTypeQueryExpression);
}