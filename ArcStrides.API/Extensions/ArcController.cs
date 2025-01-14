using ArcStrides.API.Exceptions;

namespace Microsoft.AspNetCore.Mvc;

public class ArcController : Controller
{
    public ActionResult ArcErrorResponse (Exception wrapperException)
    {
        if (wrapperException.GetType () != typeof (RequestFailureWrapperException))
            return this.Problem ($"An unknown exception has occurred: {wrapperException.GetType ().Name}");

        switch ((wrapperException as RequestFailureWrapperException)!.ActionResult)
        {
            case nameof (BadRequest):
                return this.BadRequest (wrapperException.Message);

            case nameof (Unauthorized):
                return this.Unauthorized (wrapperException.Message);

            case nameof (Forbid):
                return this.Forbid (wrapperException.Message);

            case nameof (NotFound):
                return this.NotFound (wrapperException.Message);

            case nameof (UnprocessableEntity):
                return this.UnprocessableEntity (wrapperException.Message);

            default:
                return this.Problem (wrapperException.Message);
        }
    }
}