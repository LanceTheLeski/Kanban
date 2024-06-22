using Azure.Data.Tables;
using Kanban.Contexts;
using Kanban.Models;
using Microsoft.Extensions.Options;

namespace Kanban.Repositories;

public class SwimlaneRepository
{
    private const string swimlanes = "Swimlanes";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _swimlaneTable;

    public SwimlaneRepository (IOptions<CosmosOptions> cosmosOptions)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _swimlaneTable = _tableServiceClient.GetTableClient (tableName: swimlanes);
    }

    public async Task<List<Swimlane>> GetSwimlanesForBoard (Guid boardID)
    {
        var swimlaneList = new List<Swimlane> ();

        var swimlanesFromTable = _swimlaneTable.QueryAsync<Swimlane> (swimlane => swimlane.RowKey == boardID.ToString ());
        await foreach (var swimlane in swimlanesFromTable)
            swimlaneList.Add (swimlane);

        return swimlaneList;
    }
}