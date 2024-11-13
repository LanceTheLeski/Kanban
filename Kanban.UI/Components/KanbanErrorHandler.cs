using MudBlazor;
using System.Net;

namespace Kanban.UI.Components;

public class KanbanErrorHandler : IKanbanErrorHandler
{
    private readonly ISnackbar _snackbar;

    public KanbanErrorHandler (ISnackbar snackbar)
    {
        _snackbar = snackbar;
    }

    public void AddError (string message, HttpStatusCode? errorCode)
        => AddError (message, errorCode.HasValue ? (int) errorCode : null);

    public void AddError (string errorMessage, int? errorCode)
    {
        var displayMessage = errorCode.HasValue ?
            $"{errorCode}: {errorMessage}" :
            $"{errorMessage}";

        _snackbar.Add (displayMessage);
    }
}