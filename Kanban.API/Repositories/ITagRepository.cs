using Kanban.API.Models;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public interface ITagRepository
{
    public Task<Tag?> GetTagAsync (Guid tagID, Guid parentID);

    public Task<Azure.Response> UpdateTagAsync (Tag tagToUpdate);

    public Task<Collection<Tag>> QueryTagsAsync (Expression<Func<Tag, bool>> tagQueryExpression);

    public Task<TagType?> GetTagTypeAsync (Guid tagTypeID, Guid tagGroupID);

    public Task<Azure.Response> UpdateTagGroupAsync (TagType tagTypeToUpdate);

    public Task<Collection<TagType>> QueryTagTypesAsync (Expression<Func<TagType, bool>> tagTypeQueryExpression);

    public Task<TagGroup?> GetTagGroupAsync (Guid tagGroupID, Guid tagID);

    public Task<Azure.Response> UpdateTagGroupAsync (TagGroup tagGroupToUpdate);

    public Task<Collection<TagGroup>> QueryTagGroupsAsync (Expression<Func<TagGroup, bool>> tagGroupQueryExpression);

    public Task<TagGroupType?> GetTagGroupTypeAsync (Guid tagGroupTypeID, Guid tagGroupID);

    public Task<Azure.Response> UpdateTagGroupTypeAsync (TagGroup tagGroupTypeToUpdate);

    public Task<Collection<TagGroupType>> QueryTagGroupTypesAsync (Expression<Func<TagGroupType, bool>> tagGroupTypeQueryExpression);
}