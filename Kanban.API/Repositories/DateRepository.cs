using Azure.Data.Tables;
using Kanban.API.Models;
using Kanban.API.Options;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public class DateRepository : IDateRepository
{
    private const string dates = "Dates";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _dateTable;

    public DateRepository (IOptions<CosmosOptions> cosmosOptions)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _dateTable = _tableServiceClient.GetTableClient (tableName: dates);
    }

    public async Task<Date?> GetDateAsync (Guid dateID, Guid monthID)
    {
        var response = await _dateTable.GetEntityAsync<Date> (partitionKey: dateID.ToString (), rowKey: monthID.ToString ());
        return response?.Value.GetType () == typeof (Date) ?
            response.Value :
            null;
    }

    public async Task<Azure.Response> AddDateAsync (Date dateToAdd)
        => await _dateTable.AddEntityAsync (dateToAdd);

    public async Task<Azure.Response> UpdateDateAsync (Date dateToUpdate)
        => await _dateTable.UpdateEntityAsync (dateToUpdate, Azure.ETag.All);

    public async Task<Collection<Date>> QueryDatesAsync (Expression<Func<Date, bool>> dateQueryExpression)
    {
        var dateCollection = new Collection<Date> ();

        var datesFromTable = _dateTable.QueryAsync (dateQueryExpression); //This seems to fail with certain expressions
        await foreach (var date in datesFromTable)
            dateCollection.Add (date);

        return dateCollection;
    }
}