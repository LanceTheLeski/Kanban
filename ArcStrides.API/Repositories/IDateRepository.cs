using ArcStrides.API.Models;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Repositories;

public interface IDateRepository
{
    Task<Date?> GetDateAsync (Guid dateID, Guid monthID);

    Task<Collection<Date>> GetDatesAsync (Guid dateID);

    Task<Collection<Date>> QueryDatesAsync (Expression<Func<Date, bool>> dateQueryExpression);

    Task AddDateAsync (Date dateToAdd);

    Task UpdateDateAsync (Date dateToUpdate);
}