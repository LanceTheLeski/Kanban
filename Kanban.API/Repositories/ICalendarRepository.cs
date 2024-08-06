using Kanban.API.Models;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public interface ICalendarRepository
{
    public Task<Date?> GetDateAsync (Guid dateID, Guid monthID);

    public Task<Azure.Response> UpdateDateAsync (Board dateToUpdate);

    public Task<Collection<Date>> QueryDatesAsync (Expression<Func<Date, bool>> dateQueryExpression);
}