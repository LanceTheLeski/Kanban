namespace ArcStrides.API.Messages;

public static class ErrorResponseMessages
{
    #region 400 (Client error responses)

    /// <summary>
    /// The {entity} was invalid.
    /// {validationResult}
    /// </summary>
    public static string ValidationFailedErrorResponse (string entity, string validationResult) 
        => $"The {entity} was invalid.\n{validationResult}";

    /// <summary>
    /// The {fieldName} passed in does not exist in the service.
    /// </summary>
    /// <remarks>
    /// Intended for when we try to fetch a record for a field on the object passed into the request but instead find nothing. Very similar to a 404.
    /// </remarks>
    public static string FieldDoesNotExistInDatabaseErrorResponse (string fieldName) 
        => $"The {fieldName} passed in does not exist in the service.";

    /// <summary>
    /// The patch request for the {entity} is invalid.
    /// </summary>
    public static string PatchRequestIsInvalidErrorResponse (string entity) 
        => $"The patch request for the {entity} is invalid.";

    /// <summary>
    /// The {entity} requested was not found by the service.
    /// </summary>
    public static string NotFoundErrorResponse (string entity) 
        => $"The {entity} requested was not found by the service.";

    /// <summary>
    /// A board's last column cannot be deleted while it holds cards, because a card is always in a column. Add a column for them first.
    /// </summary>
    public static string LastColumnHoldsCardsErrorResponse ()
        => "A board's last column cannot be deleted while it holds cards, because a card is always in a column. Add a column for them first.";

    /// <summary>
    /// This board has swimlanes, so a card on it needs one. Pass a SwimlaneID.
    /// </summary>
    /// <remarks>
    /// A card goes in no swimlane only on a board that has none.
    /// </remarks>
    public static string SwimlaneRequiredErrorResponse ()
        => "This board has swimlanes, so a card on it needs one. Pass a SwimlaneID.";

    /// <summary>
    /// The global colour {colour} is already {takenBy}'s. Each {entity} keeps a global colour of its own.
    /// </summary>
    /// <remarks>
    /// Unique among columns, and among swimlanes, on every board; a column and a
    /// swimlane may share one. The per-board colour is free to repeat.
    /// </remarks>
    public static string GlobalColourTakenErrorResponse (string entity, string colour, string takenBy)
        => $"The global colour {colour} is already {takenBy}'s. Each {entity} keeps a global colour of its own.";

    #endregion 400 (Client error responses)

    #region 500 (Server error responses)

    /// <summary>
    /// Could not find {entity} to database due to internal error.
    /// Internal Status: {databaseResponseStatus}
    /// </summary>
    public static string FetchFromDatabaseErrorResponse (string entity, int databaseResponseStatus)
        => $"Could not find {entity} to database due to internal error.\nInternal Status: {databaseResponseStatus}";

    /// <summary>
    /// Found multiple matches when only one {entity} was expected.
    /// </summary>
    public static string TooManyEntitiesErrorResponse (string entity) 
        => $"Found multiple matches when only one {entity} was expected.";

    /// <summary>
    /// Could not add {entity} to database due to internal error.
    /// Internal Status: {databaseResponseStatus}
    /// </summary>
    public static string AddToDatabaseErrorResponse (string entity, int databaseResponseStatus) 
        => $"Could not add {entity} to database due to internal error.\nInternal Status: {databaseResponseStatus}";

    /// <summary>
    /// There was an error updating one or more {entity} records. The operation was fully reverted.
    /// Exception Details:
    /// {exceptionDetails}
    /// </summary>
    /// <remarks>
    /// This should only be returned if absolutely everything was reverted and verified.
    /// </remarks>
    public static string UpdateEffectedEntitiesInDatabaseErrorResponse (string entity, string exceptionDetails)
        => $"There was an error updating one or more {entity} records. The operation was fully reverted.\nException Details:\n{exceptionDetails}";

    /// <summary>
    /// There was an error updating one or more {entity} records and the operation could not be fully reverted! 
    /// Please refresh and ensure data is not corrupted.
    /// Exception Details:
    /// {exceptionDetails}"
    /// </summary>
    public static string UpdateEffectedEntitiesInDatabaseCatastrophicErrorResponse (string entity, string exceptionDetails)
        => $"There was an error updating one or more {entity} records and the operation could not be fully reverted! "
           + $"Please refresh and ensure data is not corrupted.\nException Details:\n{exceptionDetails}";

    /// <summary>
    /// Could not update {entity} in the database due to internal error.
    /// Internal Status: {databaseResponseStatus}
    /// </summary>
    public static string UpdateInDatabaseErrorResponse (string entity, int databaseResponseStatus) 
        => $"Could not update {entity} in the database due to internal error.\nInternal Status: {databaseResponseStatus}";

    /// <summary>
    /// Could not remove {entity} from database due to internal error.
    /// Internal Status: {databaseResponseStatus}
    /// </summary>
    public static string RemoveFromDatabaseErrorResponse (string entity, int databaseResponseStatus) 
        => $"Could not remove {entity} from database due to internal error.\nInternal Status: {databaseResponseStatus}";

    #endregion 500 (Server error responses)
}