namespace ArcStrides.Contracts.Response;

public class DateTypeOptionsResponse
{
    /// <summary>
    /// The type's number, as a date's DateTypeID.
    /// </summary>
    public int? ID { get; init; } = null;

    /// <summary>
    /// The picture's name, or empty for none.
    /// </summary>
    public string? Scene { get; init; } = null;

    public bool? ShowsProgress { get; init; } = null;

    public int? DefaultTaskTypeID { get; init; } = null;
}
