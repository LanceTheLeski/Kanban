using Kanban.API.Models;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public interface IDateRepository
{
    public Task<Date?> GetDateAsync (Guid dateID, Guid monthID);

    public Task<Azure.Response> AddDateAsync (Date dateToAdd);

    public Task<Azure.Response> UpdateDateAsync (Date dateToUpdate);

    public Task<Collection<Date>> QueryDatesAsync (Expression<Func<Date, bool>> dateQueryExpression);
}