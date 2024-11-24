using FluentValidation;
using Kanban.Contracts.Request.Patch;
using Microsoft.AspNetCore.JsonPatch;

namespace Kanban.API.Validators;

// Add more validation later for what type of patch request can be passed in.
public class TagPatchRequestDocumentValidatorcs : AbstractValidator<JsonPatchDocument<TagPatchRequest>>
{
    public TagPatchRequestDocumentValidatorcs ()
    {
        RuleFor (tagPatchRequestDocument => tagPatchRequestDocument)
            .NotEmpty ();
    }
}