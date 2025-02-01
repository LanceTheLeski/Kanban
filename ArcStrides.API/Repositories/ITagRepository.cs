using ArcStrides.API.Models.Tag;
using ArcStrides.API.Models.TagGroup;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Repositories;

public interface ITagRepository
{
    #region Tag

    Task<Tag?> GetTagAsync (Guid tagID, Guid parentID);

    Task<Collection<Tag>> GetTagsAsync (Guid tagID);

    Task<Collection<Tag>> QueryTagsAsync (Expression<Func<Tag, bool>> tagQueryExpression);

    Task AddTagAsync (Tag tagToCreate);

    Task UpdateTagAsync (Tag tagToUpdate);

    Task DeleteTagAsync (Tag tagToDelete);

    Task<bool> ParentExistsAsync (Guid parentID, int taskTypeID);

    #endregion Tag

    #region Tag Type

    Task<TagType?> GetTagTypeAsync (int tagTypeID, Guid tagGroupID);

    Task<Collection<TagType>> GetTagTypesAsync (int tagTypeID);

    Task<Collection<TagType>> QueryTagTypesAsync (Expression<Func<TagType, bool>> tagTypeQueryExpression);

    Task UpdateTagTypeAsync (TagType tagTypeToUpdate);

    #endregion Tag Type

    #region Tag Group

    Task<TagGroup?> GetTagGroupAsync (Guid tagGroupID, Guid tagID);

    Task<Collection<TagGroup>> QueryTagGroupsAsync (Expression<Func<TagGroup, bool>> tagGroupQueryExpression);

    Task UpdateTagGroupAsync (TagGroup tagGroupToUpdate);

    #endregion Tag Group

    #region Tag Group Type

    Task<TagGroupType?> GetTagGroupTypeAsync (int tagGroupTypeID, Guid tagGroupID);

    Task<Collection<TagGroupType>> QueryTagGroupTypesAsync (Expression<Func<TagGroupType, bool>> tagGroupTypeQueryExpression);

    Task UpdateTagGroupTypeAsync (TagGroupType tagGroupTypeToUpdate);

    #endregion Tag Group Type
}