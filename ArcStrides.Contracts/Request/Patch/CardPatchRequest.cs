namespace ArcStrides.Contracts.Request.Patch;

/// <summary>
/// Patch shape for a card's own content.
///
/// Distinct from <see cref="CardPositionPatchRequest"/>, which describes where a
/// card sits on the board. Title and Description live on the Card entity, not on
/// its CardPosition, so editing them needs its own endpoint.
/// </summary>
public class CardPatchRequest
{
    public string? Title { get; set; } = null;

    public string? Description { get; set; } = null;
}
