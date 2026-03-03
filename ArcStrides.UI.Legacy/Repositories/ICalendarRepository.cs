using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;

namespace ArcStrides.UI.Repositories;

public interface ICalendarRepository
{
    Task<MonthResponse?> FetchMonthAsync (Guid monthID);

    Task<DateResponse?> CreateDateAsync (Guid monthID, DateCreateRequest dateCreateRequest);

    Task<DateResponse?> UpdateDateAsync (Guid monthID, Guid dateID, string datePatchRequest);
}