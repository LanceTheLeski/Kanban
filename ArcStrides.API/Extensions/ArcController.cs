using ArcStrides.API.Exceptions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;

namespace Microsoft.AspNetCore.Mvc;

public class ArcController : Controller
{
    public ActionResult ArcErrorResponse (Exception wrapperException)
    {
        if (wrapperException is not RequestFailureWrapperException wrapper)
            return this.Problem (DescribeUnexpectedException (wrapperException));

        switch (wrapper.ActionResult)
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

    /// <summary>
    /// What went wrong, for an exception nothing was expecting.
    /// </summary>
    /// <remarks>
    /// This used to report the type name alone — "An unknown exception has
    /// occurred: ArgumentNullException" — which says a null reached something that
    /// would not take one, without saying which null or where. Debugging a caught
    /// exception with only its type name means guessing, and guessing wrong costs
    /// a round trip each time.
    ///
    /// In Development it now gives the whole chain of messages and the first frame
    /// that has source information, which is normally the line that actually
    /// failed. Outside Development it stays at the type name: an exception message
    /// can carry keys, paths and connection details, and none of that belongs in a
    /// response to a caller.
    /// </remarks>
    private string DescribeUnexpectedException (Exception exception)
    {
        var typeName = exception.GetType ().Name;

        var environment = HttpContext?.RequestServices?.GetService<IHostEnvironment> ();
        if (environment?.IsDevelopment () is not true)
            return $"An unknown exception has occurred: {typeName}";

        var description = new StringBuilder ();
        for (var current = exception; current is not null; current = current.InnerException)
            description.Append (description.Length is 0 ? string.Empty : "  <-  ")
                       .Append ($"{current.GetType ().Name}: {current.Message}");

        // The innermost frame the compiler gave us a file for. Frames from inside
        // the framework have no file information, so this skips past them to the
        // first line of ours.
        var frame = new StackTrace (exception, fNeedFileInfo: true)
            .GetFrames ()
            .FirstOrDefault (candidate => candidate.GetFileName () is not null);

        if (frame is not null)
            description.Append ($"  at {Path.GetFileName (frame.GetFileName ())}:{frame.GetFileLineNumber ()}");

        return description.ToString ();
    }
}
