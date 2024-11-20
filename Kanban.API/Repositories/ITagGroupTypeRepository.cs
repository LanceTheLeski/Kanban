using Kanban.API.Models;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public interface ITagGroupTypeRepository
{
    public Task<TagGroupType?> GetTagGroupTypeAsync (Guid tagGroupTypeID, Guid tagGroupID);

    public Task<Azure.Response> UpdateTagGroupTypeAsync (TagGroupType tagGroupTypeToUpdate);

    public Task<Collection<TagGroupType>> QueryTagGroupTypesAsync (Expression<Func<TagGroupType, bool>> tagGroupTypeQueryExpression);
}