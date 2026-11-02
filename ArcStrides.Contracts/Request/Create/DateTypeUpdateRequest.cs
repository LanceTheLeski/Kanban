namespace ArcStrides.Contracts.Request.Create;

/// <summary>
/// The kind of day a calendar date is. The date is in the route, as year, month
/// and day, so that a day nobody has written yet can still be given a type.
/// </summary>
public class DateTypeUpdateRequest
{
    /// <summary>0 clears the type.</summary>
    public int? DateTypeID { get; init; } = null;
}
