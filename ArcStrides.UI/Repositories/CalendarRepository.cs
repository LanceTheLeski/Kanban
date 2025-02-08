using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Services;
using Newtonsoft.Json;

namespace ArcStrides.UI.Repositories;

public class CalendarRepository
{
    private readonly IArcStridesService<MonthResponse> _arcStridesMonthBackend;
    private readonly IArcStridesService<DateResponse> _arcStridesDateBackend;

    public CalendarRepository (IArcStridesService<MonthResponse> arcStridesMonthBackend,
                               IArcStridesService<DateResponse> arcStridesDateBackend)
    {
        _arcStridesMonthBackend = arcStridesMonthBackend;
        _arcStridesDateBackend = arcStridesDateBackend;
    }

    public async Task<MonthResponse?> FetchMonthAsync (Guid monthID)
        => await _arcStridesMonthBackend.FetchEntityAsync ($@"arcstrides/calendar/months/{monthID}");

    public async Task<DateResponse?> CreateDateAsync (Guid monthID, DateCreateRequest dateCreateRequest)
        => await _arcStridesDateBackend.CreateEntityAsync ($@"arcstrides/calendar/months/{monthID}/dates", JsonConvert.SerializeObject (dateCreateRequest));

    public async Task<DateResponse?> UpdateDateAsync (Guid monthID, Guid dateID, string datePatchRequest)
        => await _arcStridesDateBackend.UpdateEntityAsync ($@"arcstrides/calendar/months/{monthID}/dates/{dateID}", datePatchRequest);
}