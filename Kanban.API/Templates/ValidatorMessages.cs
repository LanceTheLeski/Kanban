namespace Kanban.API.Templates;

public static class ValidatorMessages
{
    public static string EmptyStringValidatorMessage (string fieldName) => $"The {fieldName} passed in must have a value.";
}