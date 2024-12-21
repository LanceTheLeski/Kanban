using Azure;
using System.Collections.ObjectModel;

namespace ArcStrides.API.Exceptions;

/// <summary>
/// Initializes a new instance of the <see cref="TransactionFailedException"/> 
/// class containing information on a failed transaction.
/// </summary>
/// <param name="status">The HTTP status code, or <c>0</c> if not available.</param>
/// <param name="message">The message that describes the error.</param>
/// <param name="transactionItemExceptions">Collection of failed transaction items.</param>
public class TransactionFailedException (int status, string? message, ICollection<RequestFailedException>? transactionItemExceptions = null) 
    : RequestFailedException (status, message ?? "(ReasonPhrase not provided)")
{
    /// <summary>
    /// Collection of transaction items, each converted to a <see cref="RequestFailedException"/>.
    /// </summary>
    public ICollection<RequestFailedException> TransactionItemExceptions { get; } 
        = transactionItemExceptions ?? new Collection<RequestFailedException> ();
}