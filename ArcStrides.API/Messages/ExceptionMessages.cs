namespace ArcStrides.API.Messages;

public static class ExceptionMessages
{
    /// <summary>
    /// At least one or more transaction items failed while updating a {entity} batch.
    /// Exception Details:
    /// {exceptionDetailss}"
    /// </summary>
    public static string UpdateEntityBatchTransactionExceptionMessage (string entity, string [] exceptionMessages)
        => $"At least one or more transaction items failed while updating a {entity} batch.\nException Details:\n{string.Join ("\n- ", exceptionMessages)}";

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
}