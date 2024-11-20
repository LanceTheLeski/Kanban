using FluentValidation;
using Kanban.Contracts.Request.Patch;
using Microsoft.AspNetCore.JsonPatch;

namespace Kanban.API.Validators;

public class ColumnPatchRequestDocument : AbstractValidator<JsonPatchDocument<ColumnPatchRequest>>
{
    public ColumnPatchRequestDocument ()
    {
        RuleFor (columnUpdateRequestDocument => columnUpdateRequestDocument)
            .NotEmpty ();
    }
}