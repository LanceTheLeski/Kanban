using ArcStrides.API.Mappers;
using ArcStrides.API.Messages;
using ArcStrides.API.Models.Calendar;
using ArcStrides.API.Repositories;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

using static ArcStrides.API.Validators.CalendarOptionsValidators;

namespace ArcStrides.API.Controllers;

/// <summary>
/// The calendar's options: which days are the weekend, what kind of day each half
/// of the week is by default, and what has been changed about each kind.
/// </summary>
/// <remarks>
/// There is one calendar, keyed by <see cref="Guid.Empty"/> until calendars have
/// IDs of their own. A day's own type, set on the day, always wins over these.
/// </remarks>
[ApiController]
[Route ("arcstrides/calendars/options")]
public class CalendarOptionsController : ArcController
{
    private readonly IValidator<CalendarOptionsUpdateRequest> _calendarOptionsUpdateRequestValidator;

    private readonly CalendarOptionsMapper _calendarOptionsMapper;

    private readonly ICalendarOptionsRepository _calendarOptionsRepository;

    public CalendarOptionsController (ICalendarOptionsRepository calendarOptionsRepository)
    {
        _calendarOptionsUpdateRequestValidator = new CalendarOptionsUpdateRequestValidator ();

        _calendarOptionsMapper = new CalendarOptionsMapper ();

        _calendarOptionsRepository = calendarOptionsRepository;
    }

    /// <summary>
    /// The options — <c>GET arcstrides/calendars/options</c>. With nothing chosen
    /// yet, the defaults: Saturday and Sunday are the weekend, and no day has a
    /// type it was not given.
    /// </summary>
    [HttpGet ("")]
    public async Task<ActionResult> FetchCalendarOptions ()
    {
        try
            { return Ok (await ReadCalendarOptionsAsync ()); }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    /// <summary>
    /// Replaces the options — <c>PUT arcstrides/calendars/options</c> — and answers
    /// with them as stored.
    /// </summary>
    /// <remarks>
    /// Whole, not patched: the options are one small form, saved at once. A kind of
    /// day left out of DateTypes has its row deleted, and goes back to the UI's
    /// own definition of it.
    /// </remarks>
    [HttpPut ("")]
    public async Task<ActionResult> UpdateCalendarOptions ([FromBody] CalendarOptionsUpdateRequest calendarOptionsUpdateRequest)
    {
        var validationResult = _calendarOptionsUpdateRequestValidator.Validate (calendarOptionsUpdateRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (CalendarOptionsUpdateRequest), validationResult.ToString ()));

        try
        {
            var calendarKey = Guid.Empty.ToString ();

            var calendarOptions = _calendarOptionsMapper.MapCalendarOptionsUpdateRequestToCalendarOptions (calendarOptionsUpdateRequest);
            calendarOptions.PartitionKey = calendarKey;
            calendarOptions.RowKey = calendarKey;
            await _calendarOptionsRepository.UpsertCalendarOptionsAsync (calendarOptions);

            var sentDateTypes = (calendarOptionsUpdateRequest.DateTypes ?? []).Select (_calendarOptionsMapper.MapDateTypeOptionsUpdateRequestToDateTypeOptions)
                                                                              .ToList ();
            foreach (var dateTypeOptions in sentDateTypes)
            {
                dateTypeOptions.PartitionKey = calendarKey;
                await _calendarOptionsRepository.UpsertDateTypeOptionsAsync (dateTypeOptions);
            }

            var sentIDs = sentDateTypes.Select (dateTypeOptions => dateTypeOptions.RowKey).ToHashSet ();
            foreach (var storedDateType in await _calendarOptionsRepository.GetDateTypeOptionsAsync (Guid.Empty))
                if (sentIDs.Contains (storedDateType.RowKey) is false)
                    await _calendarOptionsRepository.DeleteDateTypeOptionsAsync (storedDateType);

            return Ok (await ReadCalendarOptionsAsync ());
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    /// <summary>
    /// The options as stored, or the defaults where nothing is.
    /// </summary>
    private async Task<CalendarOptionsResponse> ReadCalendarOptionsAsync ()
    {
        var calendarOptions = await _calendarOptionsRepository.GetCalendarOptionsAsync (Guid.Empty)
                              ?? new CalendarOptions ();

        var calendarOptionsResponse = _calendarOptionsMapper.MapCalendarOptionsToCalendarOptionsResponse (calendarOptions);
        calendarOptionsResponse.DateTypes = (await _calendarOptionsRepository.GetDateTypeOptionsAsync (Guid.Empty)).Select (_calendarOptionsMapper.MapDateTypeOptionsToDateTypeOptionsResponse)
                                                                                                                  .ToList ();
        return calendarOptionsResponse;
    }
}
