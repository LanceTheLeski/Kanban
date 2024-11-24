namespace Kanban.API.Components;

public static class ValidatorMessages
{
    public static string EmptyFieldValidatorMessage (string fieldName) => $"The {fieldName} passed in must have a value.";
}