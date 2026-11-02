namespace ArcStrides.Contracts.Request.Create;

/// <summary>
/// Puts a tag on a calendar day. The day is in the route, so this is only which
/// tag: one that exists by its ID, or one by its title.
/// </summary>
public class DateTagCreateRequest
{
    public Guid? ID { get; init; } = null;

    public string? Title { get; init; } = null;
}
