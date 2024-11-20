using Kanban.API.Helpers;
using Kanban.API.Models;
using Kanban.API.Options;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public class DateRepository : EntityRepository<Date>, IDateRepository
{
    private const string dates = "Dates";

    public DateRepository (IOptions<CosmosOptions> cosmosOptions) 
                            : base (dates, cosmosOptions)
    { }

    public async Task<Date?> GetDateAsync (Guid dateID, Guid monthID)
        => await GetEntityAsync (dateID, monthID);

    public async Task<Azure.Response> AddDateAsync (Date dateToAdd)
        => await AddEntityAsync (dateToAdd);

    public async Task<Azure.Response> UpdateDateAsync (Date dateToUpdate)
        => await UpdateEntityAsync (dateToUpdate);

    public async Task<Collection<Date>> QueryDatesAsync (Expression<Func<Date, bool>> dateQueryExpression)
        => await QueryEntitiesAsync (dateQueryExpression);
}