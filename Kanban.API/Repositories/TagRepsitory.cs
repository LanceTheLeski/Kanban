using Azure.Data.Tables;
using Kanban.API.Models;
using Kanban.API.Options;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public class TagRepsitory
{
    private const string tags = "Tags";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _tagTable;

    public TagRepsitory (IOptions<CosmosOptions> cosmosOptions)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _tagTable = _tableServiceClient.GetTableClient (tableName: tags);
    }

    public async Task<Tag?> GetTagAsync (Guid tagID, Guid parentID)
    {
        var response = await _tagTable.GetEntityAsync<Tag> (partitionKey: tagID.ToString (), rowKey: parentID.ToString ());
        return response?.Value.GetType () == typeof (Tag) ?
            response.Value :
            null;
    }

    public async Task<Azure.Response> UpdateTagAsync (Tag dateToUpdate)
        => await _tagTable.UpdateEntityAsync (dateToUpdate, Azure.ETag.All);

    public async Task<Collection<Tag>> QueryTagsAsync (Expression<Func<Tag, bool>> tagQueryExpression)
    {
        var tagCollection = new Collection<Tag> ();

        var tagsFromTable = _tagTable.QueryAsync (tagQueryExpression); //This seems to fail with certain expressions
        await foreach (var tag in tagsFromTable)
            tagCollection.Add (tag);

        return tagCollection;
    }

    #region Tag Group

    public async Task<TagGroup?> GetTagGroupAsync (Guid tagGroupID, Guid tagID)
    {
        var response = await _tagTable.GetEntityAsync<TagGroup> (partitionKey: tagGroupID.ToString (), rowKey: tagID.ToString ());
        return response?.Value.GetType () == typeof (TagGroup) ?
            response.Value :
            null;
    }

    #endregion Tag Group

    // We will add a lot more code for types at some point..
}