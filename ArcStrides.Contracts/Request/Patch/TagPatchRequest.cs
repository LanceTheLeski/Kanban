namespace ArcStrides.Contracts.Request.Patch;

public class TagPatchRequest
{
    public string? Title { get; set; } = null;

    /// <summary>
    /// The tag's colour, as #rrggbb; null for the default.
    /// </summary>
    public string? Color { get; set; } = null;

    public int? TypeID { get; set; } = null;
}