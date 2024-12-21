using ArcStrides.API.Exceptions;

namespace Microsoft.AspNetCore.Mvc;

public class ArcController : Controller
{
    public ActionResult ArcResponse (RequestFailureWrapperException wrapperException)
    {
        switch (wrapperException.ActionResult)
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