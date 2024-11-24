using FluentValidation;
using Kanban.Contracts.Request.Patch;
using Microsoft.AspNetCore.JsonPatch;

namespace Kanban.API.Validators;

//Add more validation later on what type of patch request can be sent in
public class ColumnPatchRequestDocumentValidator : AbstractValidator<JsonPatchDocument<ColumnPatchRequest>>
{
    public ColumnPatchRequestDocumentValidator ()
    {
        RuleFor (columnUpdateRequestDocument => columnUpdateRequestDocument)
            .NotEmpty ();
    }
}