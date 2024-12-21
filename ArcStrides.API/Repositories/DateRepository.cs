using ArcStrides.API.Models;
using ArcStrides.API.Options;
using ArcStrides.API.Services;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Repositories;

public class DateRepository : IDateRepository
{
    private const string dates = "Dates";

    private readonly IAzureTableService<Date> _dateTable;

    public DateRepository (IOptions<AzureTableOptions> azureTableOptions)
    {
        _dateTable = new AzureTableService<Date> (dates, azureTableOptions);
    }

    public async Task<Date?> GetDateAsync (Guid dateID, Guid monthID)
        => await _dateTable.GetEntityAsync (dateID, monthID);

    public async Task<Collection<Date>> GetDatesAsync (Guid dateID)
        => await _dateTable.GetEntitiesAsync (dateID);

    public async Task<Collection<Date>> QueryDatesAsync (Expression<Func<Date, bool>> dateQueryExpression)
        => await _dateTable.QueryEntitiesAsync (dateQueryExpression);

    public async Task AddDateAsync (Date dateToAdd)
        => await _dateTable.AddEntityAsync (dateToAdd);

    public async Task UpdateDateAsync (Date dateToUpdate)
        => await _dateTable.UpdateEntityAsync (dateToUpdate);
}