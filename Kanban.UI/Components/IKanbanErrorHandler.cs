using System.Net;

namespace Kanban.UI.Components;

public interface IKanbanErrorHandler
{
    public void AddError (string message, HttpStatusCode? errorCode);

    public void AddError (string message, int? errorCode);
}