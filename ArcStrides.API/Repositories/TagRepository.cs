using ArcStrides.API.Models.Tag;
using ArcStrides.API.Models.TagGroup;
using ArcStrides.API.Options;
using ArcStrides.API.Services;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Repositories;

public class TagRepository : ITagRepository
{
    private const string tags = "Tags";
    private const string tagTypes = "TagTypes";
    private const string tagGroups = "TagGroups";
    private const string tagGroupTypes = "TagGroupTypes";

    private readonly IAzureTableService<Tag> _tagTable;
    private readonly IAzureTableService<TagType> _tagTypeTable;
    private readonly IAzureTableService<TagGroup> _tagGroupTable;
    private readonly IAzureTableService<TagGroupType> _tagGroupTypeTable;

    private readonly IColumnRepository _columnRepository;
    private readonly ISwimlaneRepository _swimlaneRepository;
    private readonly ICardRepository _cardRepository;
    private readonly ITaskRepository _taskRepository;
    private readonly IDateRepository _dateRepository;

    public TagRepository (IOptions<AzureTableOptions> azureTableOptions,
                          IColumnRepository columnRepository,
                          ISwimlaneRepository swimlaneRepository,
                          ICardRepository cardRepository,
                          ITaskRepository taskRepository,
                          IDateRepository dateRepository)
    {
        _tagTable = new AzureTableService<Tag> (tags, azureTableOptions);
        _tagTypeTable = new AzureTableService<TagType> (tagTypes, azureTableOptions);
        _tagGroupTable = new AzureTableService<TagGroup> (tagGroups, azureTableOptions);
        _tagGroupTypeTable = new AzureTableService<TagGroupType> (tagGroupTypes, azureTableOptions);

        _columnRepository = columnRepository;
        _swimlaneRepository = swimlaneRepository;
        _cardRepository = cardRepository;
        _taskRepository = taskRepository;
        _dateRepository = dateRepository;
    }

    #region Tag

    public async Task<Tag?> GetTagAsync (Guid tagID, Guid parentID)
        => await _tagTable.GetEntityAsync (tagID, parentID);

    public async Task<Collection<Tag>> GetTagsAsync (Guid tagID)
        => await _tagTable.GetEntitiesAsync (tagID);

    public async Task<Collection<Tag>> QueryTagsAsync (Expression<Func<Tag, bool>> tagQueryExpression)
        => await _tagTable.QueryEntitiesAsync (tagQueryExpression);

    public async Task AddTagAsync (Tag tagToCreate)
        => await _tagTable.AddEntityAsync (tagToCreate);

    public async Task UpdateTagAsync (Tag tagToUpdate)
        => await _tagTable.UpdateEntityAsync (tagToUpdate);

    public async Task DeleteTagAsync (Tag tagToDelete)
        => await _tagTable.DeleteEntityAsync (tagToDelete);

    /// <summary>
    /// Whether the parent a tag is being put on exists, looked for in the table
    /// its type names.
    /// </summary>
    /// <remarks>
    /// Every branch used to return <c>Count () is 0</c> — true when the parent did
    /// <em>not</em> exist — so a tag on anything real was refused as "Parent not
    /// found", and one on nothing was written. The card and task branches also
    /// read the parent ID as a board ID (GetCardPositionsAsync and GetTasksAsync
    /// take one), so they could not have found a card or a task either way.
    ///
    /// Looked for by the parent's own ID across every board. A tag is not on a
    /// board — a day is on none — and the IDs are GUIDs, so one names one row.
    /// </remarks>
    public async Task<bool> ParentExistsAsync (Guid parentID, int parentTypeID)
    {
        var parentKey = parentID.ToString ();
        switch (parentTypeID)
        {
            case TagParentTypes.Column:
                return (await _columnRepository.QueryColumnsAsync (column => column.RowKey == parentKey)).Count is not 0;

            case TagParentTypes.Swimlane:
                return (await _swimlaneRepository.QuerySwimlanesAsync (swimlane => swimlane.RowKey == parentKey)).Count is not 0;

            // A date's ID is its PartitionKey; the RowKey is its month's.
            case TagParentTypes.Date:
                return (await _dateRepository.GetDatesAsync (parentID)).Count is not 0;

            case TagParentTypes.Card:
                return (await _cardRepository.QueryCardsAsync (card => card.RowKey == parentKey)).Count is not 0;

            case TagParentTypes.Task:
                return (await _taskRepository.QueryTasksAsync (task => task.RowKey == parentKey)).Count is not 0;

            case TagParentTypes.Tag:
                return (await GetLabelRowsAsync (parentID)).Count is not 0;

            default:
                return false;
        }
    }

    /// <summary>
    /// Every row of every tag: one per tag per thing it is on.
    /// </summary>
    public async Task<Collection<Tag>> GetLabelsAsync ()
        => await _tagTable.QueryEntitiesAsync (tag => tag.IsLabel);

    /// <summary>
    /// The rows of one tag: one per thing it is on.
    /// </summary>
    public async Task<Collection<Tag>> GetLabelRowsAsync (Guid tagID)
    {
        var tagKey = tagID.ToString ();
        return await _tagTable.QueryEntitiesAsync (tag => tag.PartitionKey == tagKey && tag.IsLabel);
    }

    /// <summary>
    /// The tags on one parent.
    /// </summary>
    public async Task<Collection<Tag>> GetLabelsOnParentAsync (Guid parentID)
    {
        var parentKey = parentID.ToString ();
        return await _tagTable.QueryEntitiesAsync (tag => tag.RowKey == parentKey && tag.IsLabel);
    }

    /// <summary>
    /// Puts a tag on a parent: the tag named by <paramref name="tagID"/>, or else the
    /// one titled <paramref name="title"/>, made if there is none. Answers with the
    /// row, and whether it was written; null when <paramref name="tagID"/> names no tag.
    /// </summary>
    /// <remarks>
    /// A title is matched without case or surrounding space, so typing "blocked"
    /// where "Blocked" exists puts that tag on, in its own spelling, rather than
    /// making a second tag nobody meant. A tag already on the parent is answered
    /// as it is, unwritten, so putting it on twice is not an error.
    ///
    /// The parent is not checked here; the callers do that, by the route or by
    /// ParentExistsAsync.
    /// </remarks>
    public async Task<(Tag Tag, bool Created)?> AttachLabelAsync (Guid? tagID, string? title, Guid parentID, int parentTypeID)
    {
        Tag? existing;
        if (tagID is Guid knownTagID)
            existing = (await GetLabelRowsAsync (knownTagID)).FirstOrDefault ();
        else
        {
            var wanted = title?.Trim () ?? string.Empty;
            existing = (await GetLabelsAsync ()).FirstOrDefault (tag => string.Equals (tag.Title?.Trim (), wanted, StringComparison.OrdinalIgnoreCase));
        }

        if (tagID is not null && existing is null)
            return null;

        var tagKey = existing?.PartitionKey ?? Guid.NewGuid ().ToString ();
        var parentKey = parentID.ToString ();

        var onParent = existing is null
            ? null
            : (await GetLabelsOnParentAsync (parentID)).FirstOrDefault (tag => tag.PartitionKey == tagKey);
        if (onParent is not null)
            return (onParent, false);

        var label = new Tag
        {
            PartitionKey = tagKey,
            RowKey = parentKey,
            ParentObjectTypeName = TagParentTypes.NameOf (parentTypeID),
            Title = existing?.Title ?? title?.Trim (),
            TagTypeID = parentTypeID,
            IsLabel = true,
        };
        await AddTagAsync (label);

        return (label, true);
    }

    #endregion Tag

    #region Tag Type

    public async Task<TagType?> GetTagTypeAsync (Guid tagGroupID, int tagTypeID)
        => await _tagTypeTable.GetEntityAsync (tagGroupID, tagTypeID);

    public async Task<Collection<TagType>> GetTagTypesAsync (Guid tagGroupID)
        => await _tagTypeTable.GetEntitiesAsync (tagGroupID);

    public async Task<Collection<TagType>> QueryTagTypesAsync (Expression<Func<TagType, bool>> tagTypeQueryExpression)
        => await _tagTypeTable.QueryEntitiesAsync (tagTypeQueryExpression);

    public async Task UpdateTagTypeAsync (TagType tagTypeToUpdate)
        => await _tagTypeTable.UpdateEntityAsync (tagTypeToUpdate);

    #endregion Tag Type

    #region Tag Group

    public async Task<TagGroup?> GetTagGroupAsync (Guid tagGroupID, Guid tagID)
        => await _tagGroupTable.GetEntityAsync (tagGroupID, tagID);

    public async Task<Collection<TagGroup>> QueryTagGroupsAsync (Expression<Func<TagGroup, bool>> tagGroupQueryExpression)
        => await _tagGroupTable.QueryEntitiesAsync (tagGroupQueryExpression);

    public async Task UpdateTagGroupAsync (TagGroup tagGroupToUpdate)
        => await _tagGroupTable.UpdateEntityAsync (tagGroupToUpdate);

    public async Task AddTagGroupAsync (TagGroup tagGroupToCreate)
        => await _tagGroupTable.AddEntityAsync (tagGroupToCreate);

    public async Task DeleteTagGroupAsync (TagGroup tagGroupToDelete)
        => await _tagGroupTable.DeleteEntityAsync (tagGroupToDelete);

    #endregion Tag Group

    #region Tag Group Type

    public async Task<TagGroupType?> GetTagGroupTypeAsync (Guid tagGroupID, int tagGroupTypeID)
        => await _tagGroupTypeTable.GetEntityAsync (tagGroupID, tagGroupTypeID);

    public async Task<Collection<TagGroupType>> QueryTagGroupTypesAsync (Expression<Func<TagGroupType, bool>> tagGroupTypeQueryExpression)
        => await _tagGroupTypeTable.QueryEntitiesAsync (tagGroupTypeQueryExpression);

    public async Task UpdateTagGroupTypeAsync (TagGroupType tagGroupTypeToUpdate)
        => await _tagGroupTypeTable.UpdateEntityAsync (tagGroupTypeToUpdate);

    #endregion Tag Group Type
}