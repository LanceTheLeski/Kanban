namespace ArcStrides.Contracts.Request.Create;

/// <summary>
/// What is changed about one kind of day, inside a CalendarOptionsUpdateRequest.
/// </summary>
public class DateTypeOptionsUpdateRequest
{
    public int? ID { get; init; } = null;

    public string? Scene { get; init; } = null;

    public bool? ShowsProgress { get; init; } = null;

    public int? DefaultTaskTypeID { get; init; } = null;
}
