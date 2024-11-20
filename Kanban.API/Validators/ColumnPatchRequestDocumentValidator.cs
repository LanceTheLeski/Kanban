using FluentValidation;
using Kanban.Contracts.Request.Patch;
using Microsoft.AspNetCore.JsonPatch;

namespace Kanban.API.Validators;

public class ColumnPatchRequestDocumentValidator : AbstractValidator<JsonPatchDocument<ColumnPatchRequest>>
{
    public ColumnPatchRequestDocumentValidator ()
    {
        RuleFor (columnUpdateRequestDocument => columnUpdateRequestDocument)
            .NotEmpty ();
    }
}