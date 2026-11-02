namespace ArcStrides.Contracts.Request.Create;

/// <summary>
/// A card to put on a calendar date. The date is in the route, as year, month
/// and day, so that a day nobody has written yet can still be addressed.
/// </summary>
public class DateCardCreateRequest
{
    public Guid? CardID { get; init; } = null;
}
