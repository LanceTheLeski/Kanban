namespace ArcStrides.Contracts.Request.Patch;

public class TaskTypePatchRequest
{
    public string? Title { get; set; } = null;

    /// <summary>
    /// The type's colour, as #rrggbb; null for the default.
    /// </summary>
    public string? Color { get; set; } = null;
}