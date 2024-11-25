using FluentValidation;
using Microsoft.AspNetCore.JsonPatch;
using Kanban.Contracts.Request.Patch;

namespace Kanban.API.Validators;

public class TimelinePatchRequestDocumentValidator : AbstractValidator<JsonPatchDocument<TimelinePatchRequest>>
{
    public TimelinePatchRequestDocumentValidator ()
    {
        RuleFor (timelinePatchRequestDocument => timelinePatchRequestDocument)
            .NotEmpty ();

        //Perhaps we should apply the patch and then do more validation?
    }
}