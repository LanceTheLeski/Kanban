using ArcStrides.API.Models.Calendar;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.API.Mappers;

[Mapper]
public partial class CalendarOptionsMapper
{
    /// <summary>
    /// <see cref="CalendarOptions"/> --> <see cref="CalendarOptionsResponse"/>
    /// </summary>
    /// <remarks>
    /// Without the kinds of day, which are rows of their own; the controller adds them.
    /// </remarks>
    [MapperIgnoreTarget (nameof (CalendarOptionsResponse.DateTypes))]
    public partial CalendarOptionsResponse MapCalendarOptionsToCalendarOptionsResponse (CalendarOptions calendarOptions);

    /// <summary>
    /// <see cref="CalendarOptionsUpdateRequest"/> --> <see cref="CalendarOptions"/>
    /// </summary>
    [MapperIgnoreSource (nameof (CalendarOptionsUpdateRequest.DateTypes))]
    public partial CalendarOptions MapCalendarOptionsUpdateRequestToCalendarOptions (CalendarOptionsUpdateRequest calendarOptionsUpdateRequest);

    /// <summary>
    /// <see cref="DateTypeOptions"/> --> <see cref="DateTypeOptionsResponse"/>
    /// </summary>
    [MapProperty (nameof (DateTypeOptions.RowKey), nameof (DateTypeOptionsResponse.ID))]
    public partial DateTypeOptionsResponse MapDateTypeOptionsToDateTypeOptionsResponse (DateTypeOptions dateTypeOptions);

    /// <summary>
    /// <see cref="DateTypeOptionsUpdateRequest"/> --> <see cref="DateTypeOptions"/>
    /// </summary>
    [MapProperty (nameof (DateTypeOptionsUpdateRequest.ID), nameof (DateTypeOptions.RowKey))]
    public partial DateTypeOptions MapDateTypeOptionsUpdateRequestToDateTypeOptions (DateTypeOptionsUpdateRequest dateTypeOptionsUpdateRequest);

    /// <summary>
    /// "0,6" --> [0, 6]. A part that is not a number is left out rather than thrown on.
    /// </summary>
    private IEnumerable<int> MapWeekendDays (string weekendDays)
        => weekendDays.Split (',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                      .Select (day => int.TryParse (day, out var number) ? number : -1)
                      .Where (day => day is >= 0 and <= 6)
                      .ToList ();

    /// <summary>
    /// [6, 0] --> "0,6": in order, each once.
    /// </summary>
    private string MapWeekendDays (IEnumerable<int>? weekendDays)
        => string.Join (",", (weekendDays ?? []).Distinct ().Order ());
}
