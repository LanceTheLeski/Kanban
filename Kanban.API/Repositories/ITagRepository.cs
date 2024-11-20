using Kanban.API.Models;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public interface ITagRepository
{
    public Task<Tag?> GetTagAsync (Guid tagID, Guid parentID);

    public Task<Azure.Response> UpdateTagAsync (Tag tagToUpdate);

    public Task<Collection<Tag>> QueryTagsAsync (Expression<Func<Tag, bool>> tagQueryExpression);
}