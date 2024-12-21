namespace ArcStrides.API.Messages;

public static class ValidatorMessages
{
    public static string EmptyFieldValidatorMessage (string fieldName) 
        => $"The {fieldName} passed in must have a value.";

    public static string InvalidFieldValueFormatValidatorMessage (string fieldName) 
        => $"The {fieldName} passed in has one or more values with an invalid format.";

    public static string DuplicateFieldValidatorMessage (string fieldName)
        => $" The {fieldName} cannot be a duplicate of any other.";

    public static string FieldOutOfRangeValdiatorMessage (string fieldName)
        => $"The {fieldName} passed in is out of range.";
}