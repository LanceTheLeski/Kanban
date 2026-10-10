using ArcStrides.API.Models.Calendar;
using ArcStrides.API.Options;
using ArcStrides.API.Services;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Repositories;

public class CalendarOptionsRepository : ICalendarOptionsRepository
{
    private const string calendarOptions = "CalendarOptions";
    private const string dateTypeOptions = "DateTypeOptions";

    private readonly IAzureTableService<CalendarOptions> _calendarOptionsTable;
    private readonly IAzureTableService<DateTypeOptions> _dateTypeOptionsTable;

    public CalendarOptionsRepository (IOptions<AzureTableOptions> azureTableOptions)
    {
        _calendarOptionsTable = new AzureTableService<CalendarOptions> (calendarOptions, azureTableOptions);
        _dateTypeOptionsTable = new AzureTableService<DateTypeOptions> (dateTypeOptions, azureTableOptions);
    }

    #region Calendar Options

    /// <summary>
    /// The calendar's options row, or null when nothing has been chosen yet.
    /// </summary>
    public async Task<CalendarOptions?> GetCalendarOptionsAsync (Guid calendarID)
        => (await _calendarOptionsTable.GetEntitiesAsync (calendarID)).FirstOrDefault ();

    public async Task UpsertCalendarOptionsAsync (CalendarOptions calendarOptionsToWrite)
        => await _calendarOptionsTable.UpsertEntityAsync (calendarOptionsToWrite);

    #endregion Calendar Options

    #region Date Type Options

    public async Task<Collection<DateTypeOptions>> GetDateTypeOptionsAsync (Guid calendarID)
        => await _dateTypeOptionsTable.GetEntitiesAsync (calendarID);

    public async Task UpsertDateTypeOptionsAsync (DateTypeOptions dateTypeOptionsToWrite)
        => await _dateTypeOptionsTable.UpsertEntityAsync (dateTypeOptionsToWrite);

    public async Task DeleteDateTypeOptionsAsync (DateTypeOptions dateTypeOptionsToDelete)
        => await _dateTypeOptionsTable.DeleteEntityAsync (dateTypeOptionsToDelete);

    #endregion Date Type Options
}
