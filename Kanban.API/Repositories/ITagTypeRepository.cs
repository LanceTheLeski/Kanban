using Kanban.API.Models;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public interface ITagTypeRepository
{
    public Task<TagType?> GetTagTypeAsync (Guid tagTypeID, Guid tagGroupID);

    public Task<Collection<TagType>> QueryTagTypesAsync (Expression<Func<TagType, bool>> tagTypeQueryExpression);

    public Task<Azure.Response> UpdateTagTypeAsync (TagType tagTypeToUpdate);
}