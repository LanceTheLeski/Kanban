namespace ArcStrides.API.Models.Tag;

/// <summary>
/// What a tag's parent is, as <see cref="Tag.TagTypeID"/> stores it.
/// </summary>
/// <remarks>
/// The numbers TagRepository.ParentExistsAsync has always switched on, named. A
/// tag's parent is only an ID, and the same ID could be looked for in any of six
/// tables, so the type says which.
/// </remarks>
public static class TagParentTypes
{
    /// <summary>
    /// On nothing: the row a tag keeps once its last parent is gone — see
    /// <see cref="Tag.OrphanParentKey"/>.
    /// </summary>
    public const int None = -1;

    public const int Column = 0;

    public const int Swimlane = 1;

    public const int Date = 2;

    public const int Card = 3;

    public const int Task = 4;

    public const int Tag = 5;

    /// <summary>
    /// The name a parent type is stored under, in <see cref="Tag.ParentObjectTypeName"/>.
    /// </summary>
    public static string NameOf (int parentTypeID)
        => parentTypeID switch
        {
            Column => nameof (Column),
            Swimlane => nameof (Swimlane),
            Date => nameof (Date),
            Card => nameof (Card),
            Task => nameof (Task),
            Tag => nameof (Tag),
            None => nameof (None),
            _ => "Unknown"
        };
}
