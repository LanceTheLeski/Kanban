using System.Net;

namespace ArcStrides.UI.Components.ArcErrorHandler;

public interface IArcErrorHandler
{
    public void AddError(string message, HttpStatusCode? errorCode);

    public void AddError(string message, int? errorCode);
}