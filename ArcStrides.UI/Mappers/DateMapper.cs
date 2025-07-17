using ArcStrides.Contracts.Response;
using ArcStrides.UI.Models.Calendar;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.UI.Mappers;

[Mapper]
public partial class DateMapper
{
    /// <summary>
    /// <see cref="DateTime"/> --> <see cref="Date"/>
    /// </summary>
    [MapProperty (nameof (DateTime.Day), nameof (Date.DateOrder))]
    [MapProperty (nameof (DateTime.DayOfWeek), nameof (Date.DayOfTheWeekOrder))]
    public partial Date MapDateTimeToDate (DateTime dateTime);

    /// <summary>
    /// <see cref="DateResponse"/> --> <see cref="Date"/>
    /// </summary>
    [MapProperty (nameof (DateResponse.ID), nameof (Date.ID))]
    [MapProperty (nameof (DateResponse.DateOrder), nameof (Date.DateOrder))]
    [MapProperty (nameof (DateResponse.WeekOrder), nameof (Date.WeekOrder))]
    [MapProperty (nameof (DateResponse.DayOfTheWeekOrder), nameof (Date.DayOfTheWeekOrder))]
    [MapProperty (nameof (DateResponse.MonthName), nameof (Date.Month))]
    [MapProperty (nameof (DateResponse.YearOrder), nameof (Date.Year))]
    [MapProperty (nameof (DateResponse.Cards), nameof (Date.Cards))]
    public partial Date MapDateResponseToDate (DateResponse dateResponse);
}