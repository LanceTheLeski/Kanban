using ArcStrides.UI.Models;
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
}