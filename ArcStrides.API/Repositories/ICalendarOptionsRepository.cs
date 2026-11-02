using ArcStrides.API.Models.Calendar;
using System.Collections.ObjectModel;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Repositories;

public interface ICalendarOptionsRepository
{
    #region Calendar Options

    Task<CalendarOptions?> GetCalendarOptionsAsync (Guid calendarID);

    Task UpsertCalendarOptionsAsync (CalendarOptions calendarOptionsToWrite);

    #endregion Calendar Options

    #region Date Type Options

    Task<Collection<DateTypeOptions>> GetDateTypeOptionsAsync (Guid calendarID);

    Task UpsertDateTypeOptionsAsync (DateTypeOptions dateTypeOptionsToWrite);

    Task DeleteDateTypeOptionsAsync (DateTypeOptions dateTypeOptionsToDelete);

    #endregion Date Type Options
}
