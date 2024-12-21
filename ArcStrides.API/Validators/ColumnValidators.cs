using ArcStrides.API.Messages;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using FluentValidation;
using Microsoft.AspNetCore.JsonPatch;

namespace ArcStrides.API.Validators;

public class ColumnValidators
{
    public class ColumnCreateRequestValidator : AbstractValidator<ColumnCreateRequest>
    {
        public ColumnCreateRequestValidator ()
        {
            RuleFor (columnCreateRequest => columnCreateRequest.Title)
                .NotEmpty ()
                .WithMessage (ValidatorMessages.EmptyFieldValidatorMessage (nameof (ColumnCreateRequest.Title)));

            RuleFor (columnCreateRequest => columnCreateRequest.Order)
                .NotNull ();
        }
    }

    public class ColumnPatchRequestDocumentValidator : AbstractValidator<JsonPatchDocument<ColumnPatchRequest>>
    {
        public ColumnPatchRequestDocumentValidator ()
        {
            RuleFor (columnUpdateRequestDocument => columnUpdateRequestDocument)
                .NotEmpty ();
        }
    }
}
