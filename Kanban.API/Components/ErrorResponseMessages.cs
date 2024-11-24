namespace Kanban.API.Components;

public static class ErrorResponseMessages
{
    public static string ValidationFailedErrorResponse (string entity) => $"The {entity} was invalid.";

    public static string NotFoundErrorResponse (string entity) => $"The {entity} requested was not found by the service.";

    public static string NoRequestBodyErrorResponse (string entity) => $"There was not a {entity} passed into the request.";

    public static string TooManyEntitiesErrorResponse (string entity) => $"Found multiple matches when only one {entity} was expected.";

    public static string FieldDoesNotExistInDatabaseErrorResponse (string fieldName) => $"The {fieldName} passed in does not exist in the service.";

    public static string AddToDatabaseErrorResponse (string entity) => $"Could not add {entity} to database due to internal error.";

    public static string PatchRequestIsInvalidErrorResponse (string entity) => $"The patch request for the {entity} is invalid.";

    public static string UpdateInDatabaseErrorResponse (string entity) => $"Could not update {entity} in the database due to internal error.";

    public static string RemoveFromDatabaseErrorResponse (string entity) => $"Could not remove {entity} from database due to internal error.";
}