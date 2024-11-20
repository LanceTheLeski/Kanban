using Kanban.API.Helpers;
using Kanban.API.Models;
using Kanban.API.Options;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public class TagTypeRepository : EntityRepository<TagType>, ITagTypeRepository
{
    private const string tagTypes = "TagTypes";

    public TagTypeRepository (IOptions<CosmosOptions> cosmosOptions)
        : base (tagTypes, cosmosOptions)
    { }

    public async Task<TagType?> GetTagTypeAsync (Guid tagTypeID, Guid tagGroupID)
        => await GetTagTypeAsync (tagTypeID, tagGroupID);

    public async Task<Azure.Response> UpdateTagTypeAsync (TagType tagTypeToUpdate)
        => await UpdateEntityAsync (tagTypeToUpdate);

    public async Task<Collection<TagType>> QueryTagTypesAsync (Expression<Func<TagType, bool>> tagTypeQueryExpression)
        => await QueryEntitiesAsync (tagTypeQueryExpression);

}