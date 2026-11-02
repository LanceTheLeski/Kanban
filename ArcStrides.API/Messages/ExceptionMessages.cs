namespace ArcStrides.API.Messages;

public static class ExceptionMessages
{
    /// <summary>
    /// At least one or more transaction items failed while updating on the {entityTable} table
    /// Exception Details:
    /// {exceptionDetails}"
    /// </summary>
    public static string UpdateEntityBatchTransactionExceptionMessage (string entityTable, string [] exceptionMessages)
        => $"At least one or more transaction items failed while updating on the {entityTable} table.\nException Details:\n{string.Join ("\n- ", exceptionMessages)}";

    /// <summary>
    /// The {entity} Collection unexpectedly did not contain an instance of the newly added {entity}.
    /// </summary>
    public static string EntityCollectionDoesNotContainNewEntityExceptionMessage (string entity)
        => $"The {entity} Collection unexpectedly did not contain an instance of the newly added {entity}.";

    /// <summary>
    /// Query on {entity} against table '{tableName}' failed, with the storage status and
    /// error code when the failure came back as a response.
    /// </summary>
    /// <remarks>
    /// The status and error code are what separate the storage failures that look
    /// identical from the outside: TableNotFound (404) means the table was never
    /// created, while a status of 0 means the request never reached storage at all —
    /// typically the emulator not running, with the socket error in the inner
    /// exception.
    /// </remarks>
    public static string EntityQueryFailedExceptionMessage (string entity,
                                                            string tableName,
                                                            int status = 0,
                                                            string? errorCode = null)
        => $"Query on {entity} by custom expression failed against table '{tableName}'"
         + (status > 0 ? $" — {errorCode ?? "no error code"} ({status})" : " — no response from storage")
         + ".";

    /// <summary>
    /// The given partition key for item {entityType} does not match the common partition key for this transaction.
    /// </summary>
    public static string EntityPartitionKeyDoesNotMatchTransactionExceptionMessage (string entityType)
        => $"The given partition key for item {entityType} does not match the common partition key for this transaction.";

    /// <summary>
    /// This transaction should not have the action type {entityActionType}.
    /// </summary>
    public static string EntityActionTypeIsInvalidExceptionMessage (string entityActionType)
        => $"This transaction should not have the action type {entityActionType}.";
}