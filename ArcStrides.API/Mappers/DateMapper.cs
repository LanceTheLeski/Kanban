using ArcStrides.API.Models.Calendar;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.API.Calendars.Mappers;

[Mapper]
public partial class DateMapper
{
    /// <summary>
    /// <see cref="DateCreateRequest"/> --> <see cref="Date"/>
    /// </summary>
    [MapProperty (nameof (DateCreateRequest.DateOrder), nameof (Date.DateOrder))]
    [MapProperty (nameof (DateCreateRequest.WeekOrder), nameof (Date.WeekOrder))]
    [MapProperty (nameof (DateCreateRequest.DayOfTheWeekOrder), nameof (Date.DayOfTheWeekOrder))]
    [MapProperty (nameof (DateCreateRequest.MonthOrder), nameof (Date.MonthOrder))]
    [MapProperty (nameof (DateCreateRequest.MonthName), nameof (Date.MonthName))]
    [MapProperty (nameof (DateCreateRequest.Year), nameof (Date.Year))]
    public partial Date MapDateCreateRequestToDate (DateCreateRequest dateCreateRequest);

    /// <summary>
    /// <see cref="DatePatchRequest"/> --> <see cref="Date"/>
    /// </summary>
    [MapProperty (nameof (DatePatchRequest.DateOrder), nameof (Date.DateOrder))]
    [MapProperty (nameof (DatePatchRequest.WeekOrder), nameof (Date.WeekOrder))]
    [MapProperty (nameof (DatePatchRequest.DayOfTheWeekOrder), nameof (Date.DayOfTheWeekOrder))]
    [MapProperty (nameof (DatePatchRequest.MonthOrder), nameof (Date.MonthOrder))]
    [MapProperty (nameof (DatePatchRequest.MonthName), nameof (Date.MonthName))]
    [MapProperty (nameof (DatePatchRequest.Year), nameof (Date.Year))]
    public partial Date MapDatePatchRequestToDate (DatePatchRequest datePatchRequest);

    /// <summary>
    /// <see cref="Date"/> --> <see cref="DateResponse"/>
    /// </summary>
    [MapProperty (nameof (Date.RowKey), nameof (DateResponse.ID))]
    [MapProperty (nameof (Date.DateOrder), nameof (DateResponse.DateOrder))]
    [MapProperty (nameof (Date.WeekOrder), nameof (DateResponse.WeekOrder))]
    [MapProperty (nameof (Date.DayOfTheWeekOrder), nameof (DateResponse.DayOfTheWeekOrder))]
    public partial DateResponse MapDateToDateResponse (Date date);
}