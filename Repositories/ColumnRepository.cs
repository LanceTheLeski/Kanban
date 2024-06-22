using Azure.Data.Tables;
using Kanban.Contexts;
using Kanban.Models;
using Microsoft.Extensions.Options;

namespace Kanban.Repositories;

public class ColumnRepository
{
    private const string columns = "Columns";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _columnTable;

    public ColumnRepository (IOptions<CosmosOptions> cosmosOptions)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _columnTable = _tableServiceClient.GetTableClient (tableName: columns);
    }

    public async Task<List<Column>> GetColumnsForBoard (Guid boardID)
    {
        var columnList = new List<Column> ();

        var columnsFromTable = _columnTable.QueryAsync<Column> (column => column.PartitionKey == boardID.ToString ());
        await foreach (var column in columnsFromTable)
            columnList.Add (column);

        return columnList;
    }
}