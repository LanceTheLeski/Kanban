namespace ArcStrides.Contracts.Request.Patch;

public class TagPatchRequest
{
    public string? Title { get; set; } = null;

    public int? TypeID { get; set; } = null;
}