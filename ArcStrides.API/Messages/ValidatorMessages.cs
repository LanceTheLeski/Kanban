namespace ArcStrides.API.Messages;

public static class ValidatorMessages
{
    /// <summary>
    /// The {fieldName} passed in must have a value.
    /// </summary>
    public static string EmptyFieldValidatorMessage (string fieldName) 
        => $"The {fieldName} passed in must have a value.";

    /// <summary>
    /// The {fieldName} passed in has one or more values with an invalid format.
    /// </summary>
    public static string InvalidFieldValueFormatValidatorMessage (string fieldName) 
        => $"The {fieldName} passed in has one or more values with an invalid format.";

    /// <summary>
    /// The {fieldName} cannot be a duplicate of any other.
    /// </summary>
    public static string DuplicateFieldValidatorMessage (string fieldName)
        => $"The {fieldName} cannot be a duplicate of any other.";

    /// <summary>
    /// The {fieldName} cannot be a duplicate of any other. Repeated: {values}.
    /// </summary>
    /// <remarks>
    /// Naming the values is the whole point. "The SwimlaneOrder cannot be a
    /// duplicate of any other" tells you a rule; "Repeated: '0'" tells you which
    /// row to go and look at.
    ///
    /// GroupBy is used rather than Distinct because LINQ's grouping handles a null
    /// key itself instead of passing it to the comparer, so a field that is simply
    /// unset reports as "(not set)" rather than risking a throw from inside the
    /// error path.
    /// </remarks>
    public static string DuplicateFieldValidatorMessage<TValue> (string fieldName,
                                                                 IEnumerable<TValue> values,
                                                                 IEqualityComparer<TValue>? comparer = null)
    {
        var repeated = values.GroupBy (value => value, comparer)
                             .Where (group => group.Count () > 1)
                             .Select (group => group.Key is null ? "(not set)" : $"'{group.Key}'")
                             .ToList ();

        return repeated.Count == 0
            ? DuplicateFieldValidatorMessage (fieldName)
            : $"{DuplicateFieldValidatorMessage (fieldName)} Repeated: {string.Join (", ", repeated)}.";
    }

    /// <summary>
    /// The {fieldName} passed in is out of range.
    /// </summary>
    public static string FieldOutOfRangeValdiatorMessage (string fieldName)
        => $"The {fieldName} passed in is out of range.";
}