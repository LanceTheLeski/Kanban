using Microsoft.AspNetCore.Mvc;

namespace ArcStrides.API.Exceptions;

public class RequestFailureWrapperException (string actionResult, string? message) : Exception (message)
{
    public string ActionResult { get; } = actionResult;
}