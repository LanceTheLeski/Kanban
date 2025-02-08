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
    /// The {fieldName} passed in is out of range.
    /// </summary>
    public static string FieldOutOfRangeValdiatorMessage (string fieldName)
        => $"The {fieldName} passed in is out of range.";
}