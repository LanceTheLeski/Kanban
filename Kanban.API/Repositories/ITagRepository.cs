using Kanban.API.Models;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public interface ITagRepository
{
    Task<Tag?> GetTagAsync (Guid tagID, Guid parentID);

    Task<Azure.Response> AddTagAsync (Tag tagToCreate);

    Task<Azure.Response> UpdateTagAsync (Tag tagToUpdate);

    Task<Azure.Response> DeleteTagAsync (Tag tagToDelete);

    Task<Collection<Tag>> QueryTagsAsync (Expression<Func<Tag, bool>> tagQueryExpression);

    Task<bool> ParentExistsAsync (Guid parentID, int taskTypeID);
}