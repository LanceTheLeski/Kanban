namespace Kanban.API.Components;

public static class ValidatorMessages
{
    public static string EmptyFieldValidatorMessage (string fieldName) => $"The {fieldName} passed in must have a value.";

    public static string InvalidFieldValueFormatValidatorMessage (string fieldName) => $"The {fieldName} passed in has one or more values with an invalid format.";
}