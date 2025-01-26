using ArcStrides.API.Models;
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

    public async Task<bool> ParentExistsAsync (Guid parentID, int taskTypeID)
    {
        switch (taskTypeID)
        {
            case 0:// Column
                var columnCollection = await _columnRepository.QueryColumnsAsync (column => column.RowKey == parentID.ToString ());
                return columnCollection?.Count () is 0;

            case 1:// Swimlane
                var swimlaneCollection = await _swimlaneRepository.QuerySwimlanesAsync (swimlane => swimlane.RowKey == parentID.ToString ());
                return swimlaneCollection?.Count () is 0;

            case 2:// Date
                var dateCollection = await _dateRepository.GetDatesAsync (parentID);
                return dateCollection?.Count () is 0;

            case 3:// Card
                var cardCollection = await _cardRepository.GetCardPositionsAsync (parentID);
                return cardCollection?.Count () is 0;

            case 4:// Task
                var taskCollection = await _taskRepository.GetTasksAsync (parentID);
                return taskCollection?.Count () is 0;

            case 5:// Tag
                var tagCollection = await this.GetTagsAsync (parentID);
                return tagCollection?.Count () is 0;

            default:
                return false;
        }
    }

    #endregion Tag

    #region Tag Type

    public async Task<TagType?> GetTagTypeAsync (int tagTypeID, Guid tagGroupID)
        => await _tagTypeTable.GetEntityAsync (tagTypeID, tagGroupID);

    public async Task<Collection<TagType>> GetTagTypesAsync (int tagTypeID)
        => await _tagTypeTable.GetEntitiesAsync (tagTypeID);

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

    #endregion Tag Group

    #region Tag Group Type

    public async Task<TagGroupType?> GetTagGroupTypeAsync (int tagGroupTypeID, Guid tagGroupID)
        => await _tagGroupTypeTable.GetEntityAsync (tagGroupTypeID, tagGroupID);

    public async Task<Collection<TagGroupType>> QueryTagGroupTypesAsync (Expression<Func<TagGroupType, bool>> tagGroupTypeQueryExpression)
        => await _tagGroupTypeTable.QueryEntitiesAsync (tagGroupTypeQueryExpression);

    public async Task UpdateTagGroupTypeAsync (TagGroupType tagGroupTypeToUpdate)
        => await _tagGroupTypeTable.UpdateEntityAsync (tagGroupTypeToUpdate);

    #endregion Tag Group Type
}