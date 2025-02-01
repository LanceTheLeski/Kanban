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
    /// Query on {entity} by custom expression failed on execution.
    /// </summary>
    public static string EntityQueryFailedExceptionMessage (string entity)
        => $"Query on {entity} by custom expression failed on execution.";

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