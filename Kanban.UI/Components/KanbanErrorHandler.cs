using MudBlazor;

namespace Kanban.UI.Components;

public partial class KanbanErrorHandler
{
    private readonly ISnackbar _snackbar;

    public KanbanErrorHandler (ISnackbar snackbar)
    {
        _snackbar = snackbar;
    }

    public void AddError (string message, int? errorCode)
    {
        _snackbar.Add ($"{errorCode}: {message}"); // At some point I want to make this possible clickable. That will pop up an overlay with more info on the error.
    }
}