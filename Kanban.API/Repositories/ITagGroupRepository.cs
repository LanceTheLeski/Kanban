using Kanban.API.Models;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public interface ITagGroupRepository
{
    public Task<TagGroup?> GetTagGroupAsync (Guid tagGroupID, Guid tagID);

    public Task<Azure.Response> UpdateTagGroupAsync (TagGroup tagGroupToUpdate);

    public Task<Collection<TagGroup>> QueryTagGroupsAsync (Expression<Func<TagGroup, bool>> tagGroupQueryExpression);
}