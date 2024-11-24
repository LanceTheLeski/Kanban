using Azure.Data.Tables;
using Kanban.API.Components;
using Kanban.API.Models;
using Kanban.API.Options;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public class TagRepository : EntityRepository<Tag>, ITagRepository
{
    private const string tags = "Tags";
    private const string tagTypes = "TagTypes";
    private const string tagGroups = "TagGroups";
    private const string tagGroupTypes = "TagGroupTypes";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _tagTable;
    private readonly TableClient _tagTypeTable;
    private readonly TableClient _tagGroupTable;
    private readonly TableClient _tagGroupTypeTable;

    private readonly IBoardRepository _boardCardRepository;
    private readonly IColumnRepository _columnRepository;
    private readonly ISwimlaneRepository _swimlaneRepository;
    private readonly ICardRepository _cardRepository;
    private readonly ITaskRepository _taskRepository;
    private readonly IDateRepository _dateRepository;

    public TagRepository (IOptions<CosmosOptions> cosmosOptions,
                          IBoardRepository boardRepository,
                          IColumnRepository columnRepository,
                          ISwimlaneRepository swimlaneRepository,
                          ICardRepository cardRepository,
                          ITaskRepository taskRepository,
                          IDateRepository dateRepository)
                            : base (tags, cosmosOptions)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _tagTable = _tableServiceClient.GetTableClient (tableName: tags);
        _tagTypeTable = _tableServiceClient.GetTableClient(tableName: tagTypes);
        _tagGroupTable = _tableServiceClient.GetTableClient (tableName: tagGroups);
        _tagGroupTypeTable = _tableServiceClient.GetTableClient (tableName: tagGroupTypes);

        _boardCardRepository = boardRepository;
        _columnRepository = columnRepository;
        _swimlaneRepository = swimlaneRepository;
        _cardRepository = cardRepository;
        _taskRepository = taskRepository;
        _dateRepository = dateRepository;
    }

    public async Task<Tag?> GetTagAsync (Guid tagID, Guid parentID)
        => await GetEntityAsync (tagID, parentID);

    public async Task<Azure.Response> AddTagAsync (Tag tagToCreate)
        => await AddEntityAsync (tagToCreate);

    public async Task<Azure.Response> UpdateTagAsync (Tag tagToUpdate)
        => await UpdateEntityAsync (tagToUpdate);

    public async Task<Azure.Response> DeleteTagAsync (Tag tagToDelete)
        => await DeleteEntityAsync (tagToDelete);

    public async Task<Collection<Tag>> QueryTagsAsync (Expression<Func<Tag, bool>> tagQueryExpression)
        => await QueryEntitiesAsync (tagQueryExpression);

    #region Tag Type

    public async Task<TagType?> GetTagTypeAsync (Guid tagTypeID, Guid tagGroupID)
    {
        var response = await _tagTypeTable.GetEntityAsync<TagType> (partitionKey: tagTypeID.ToString (), rowKey: tagGroupID.ToString ());
        return response?.Value.GetType () == typeof (TagType) ?
            response.Value :
            null;
    }

    public async Task<Azure.Response> UpdateTagGroupAsync (TagType tagTypeToUpdate)
        => await _tagTypeTable.UpdateEntityAsync (tagTypeToUpdate, Azure.ETag.All);

    public async Task<Collection<TagType>> QueryTagTypesAsync (Expression<Func<TagType, bool>> tagTypeQueryExpression)
    {
        var tagTypeCollection = new Collection<TagType> ();

        var tagTypesFromTable = _tagTypeTable.QueryAsync (tagTypeQueryExpression); //This seems to fail with certain expressions
        await foreach (var tagType in tagTypesFromTable)
            tagTypeCollection.Add (tagType);

        return tagTypeCollection;
    }

    #endregion Tag Type

    #region Tag Group

    public async Task<TagGroup?> GetTagGroupAsync (Guid tagGroupID, Guid tagID)
    {
        var response = await _tagGroupTable.GetEntityAsync<TagGroup> (partitionKey: tagGroupID.ToString (), rowKey: tagID.ToString ());
        return response?.Value.GetType () == typeof (TagGroup) ?
            response.Value :
            null;
    }

    public async Task<Azure.Response> UpdateTagGroupAsync (TagGroup tagGroupToUpdate)
        => await _tagGroupTable.UpdateEntityAsync (tagGroupToUpdate, Azure.ETag.All);

    // adjust query stuff to only use equals
    public async Task<Collection<TagGroup>> QueryTagGroupsAsync (Expression<Func<TagGroup, bool>> tagGroupQueryExpression)
    {
        var tagGroupCollection = new Collection<TagGroup> ();

        var tagGroupsFromTable = _tagGroupTable.QueryAsync (tagGroupQueryExpression); //This seems to fail with certain expressions
        await foreach (var tagGroup in tagGroupsFromTable)
            tagGroupCollection.Add (tagGroup);

        return tagGroupCollection;
    }

    #endregion Tag Group

    #region Tag Group Type

    public async Task<TagGroupType?> GetTagGroupTypeAsync (Guid tagGroupTypeID, Guid tagGroupID)
    {
        var response = await _tagGroupTypeTable.GetEntityAsync<TagGroupType> (partitionKey: tagGroupTypeID.ToString (), rowKey: tagGroupID.ToString ());
        return response?.Value.GetType () == typeof (TagGroupType) ?
            response.Value :
            null;
    }

    public async Task<Azure.Response> UpdateTagGroupTypeAsync (TagGroup tagGroupTypeToUpdate)
        => await _tagGroupTypeTable.UpdateEntityAsync (tagGroupTypeToUpdate, Azure.ETag.All);

    public async Task<Collection<TagGroupType>> QueryTagGroupTypesAsync (Expression<Func<TagGroupType, bool>> tagGroupTypeQueryExpression)
    {
        var tagGroupTypeCollection = new Collection<TagGroupType> ();

        var tagGroupTypesFromTable = _tagGroupTypeTable.QueryAsync (tagGroupTypeQueryExpression); //This seems to fail with certain expressions
        await foreach (var tagGroupType in tagGroupTypesFromTable)
            tagGroupTypeCollection.Add (tagGroupType);

        return tagGroupTypeCollection;
    }

    #endregion Tag Group Type

    public async Task<bool> ParentExistsAsync (Guid parentID, int taskTypeID)
    {
        switch (taskTypeID)
        {
            case 0:// BoardCard
                var boardCardCollection = await _boardCardRepository.QueryBoardCardsAsync (boardCard => boardCard.PartitionKey == parentID.ToString ());
                return boardCardCollection?.Count () is 0;
            
            case 1:// Column
                var columnCollection = await _columnRepository.QueryColumnsAsync (column => column.PartitionKey == parentID.ToString ());
                return columnCollection?.Count () is 0;
            
            case 2:// Swimlane
                var swimlaneCollection = await _swimlaneRepository.QuerySwimlanesAsync (swimlane => swimlane.PartitionKey == parentID.ToString ());
                return swimlaneCollection?.Count () is 0;
            
            case 3:// Card
                var cardCollection = await _cardRepository.QueryCardsAsync (card => card.PartitionKey == parentID.ToString ());
                return cardCollection?.Count () is 0;
            
            case 4:// Task
                var taskCollection = await _taskRepository.QueryTasksAsync (task => task.PartitionKey == parentID.ToString ());
                return taskCollection?.Count () is 0;
            
            case 5:// Tag
                var tagCollection = await this.QueryTagsAsync (tag => tag.PartitionKey == parentID.ToString ());
                return tagCollection?.Count () is 0;
            
            case 6:// Date
                var dateCollection = await _dateRepository.QueryDatesAsync (date => date.PartitionKey == parentID.ToString ());
                return dateCollection?.Count () is 0;
            
            default: 
                return false;
        }
    }
}