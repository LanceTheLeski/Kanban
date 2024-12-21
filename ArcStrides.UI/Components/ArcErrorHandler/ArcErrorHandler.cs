using MudBlazor;
using System.Net;

namespace ArcStrides.UI.Components.ArcErrorHandler;

public class ArcErrorHandler : IArcErrorHandler
{
    private readonly ISnackbar _snackbar;

    public ArcErrorHandler(ISnackbar snackbar)
    {
        _snackbar = snackbar;
    }

    public void AddError(string message, HttpStatusCode? errorCode)
        => AddError(message, errorCode.HasValue ? (int)errorCode : null);

    public void AddError(string errorMessage, int? errorCode)
    {
        var displayMessage = errorCode.HasValue ?
            $"{errorCode}: {errorMessage}" :
            $"{errorMessage}";

        _snackbar.Add(displayMessage);
    }
}