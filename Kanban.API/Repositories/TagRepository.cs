using Azure.Data.Tables;
using Kanban.API.Helpers;
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

    public TagRepository (IOptions<CosmosOptions> cosmosOptions)
                            : base (tags, cosmosOptions)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _tagTable = _tableServiceClient.GetTableClient (tableName: tags);
        _tagTypeTable = _tableServiceClient.GetTableClient(tableName: tagTypes);
        _tagGroupTable = _tableServiceClient.GetTableClient (tableName: tagGroups);
        _tagGroupTypeTable = _tableServiceClient.GetTableClient (tableName: tagGroupTypes);
    }

    public async Task<Tag?> GetTagAsync (Guid tagID, Guid parentID)
    {
        var response = await _tagTable.GetEntityAsync<Tag> (partitionKey: tagID.ToString (), rowKey: parentID.ToString ());
        return response?.Value.GetType () == typeof (Tag) ?
            response.Value :
            null;
    }

    public async Task<Azure.Response> UpdateTagAsync (Tag tagToUpdate)
        => await _tagTable.UpdateEntityAsync (tagToUpdate, Azure.ETag.All);

    public async Task<Collection<Tag>> QueryTagsAsync (Expression<Func<Tag, bool>> tagQueryExpression)
    {
        var tagCollection = new Collection<Tag> ();

        var tagsFromTable = _tagTable.QueryAsync (tagQueryExpression); //This seems to fail with certain expressions
        await foreach (var tag in tagsFromTable)
            tagCollection.Add (tag);

        return tagCollection;
    }

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
}