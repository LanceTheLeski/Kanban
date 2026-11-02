using System.Text.RegularExpressions;

namespace ArcStrides.API.Validators;

/// <summary>
/// Colours as the API stores them, for tags and task types alike.
/// </summary>
public static class ColorValidators
{
    /// <summary>
    /// Whether a colour is one that can be stored: <c>#rrggbb</c>, as the colour
    /// picker writes it.
    /// </summary>
    public static bool IsColor (string color)
        => Regex.IsMatch (color, "^#[0-9A-Fa-f]{6}$");
}
