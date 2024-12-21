using ArcStrides.API.Messages;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using FluentValidation;
using Microsoft.AspNetCore.JsonPatch;

namespace ArcStrides.API.Validators;

public class TagValidators
{
    public class TagCreateRequestValidator : AbstractValidator<TagCreateRequest>
    {
        public TagCreateRequestValidator ()
        {
            RuleFor (tagCreateRequest => tagCreateRequest.ParentID)
                .NotEmpty ()
                .WithMessage (ValidatorMessages.EmptyFieldValidatorMessage (nameof (TagCreateRequest.ParentID)));

            RuleFor (tagCreateRequest => tagCreateRequest.Title)
                .NotEmpty ()
                .WithMessage (ValidatorMessages.EmptyFieldValidatorMessage (nameof (TagCreateRequest.Title)));

            RuleFor (tagCreateRequest => tagCreateRequest.TypeID)
                .NotEmpty ()
                .WithMessage (ValidatorMessages.EmptyFieldValidatorMessage (nameof (TagCreateRequest.TypeID)));
        }
    }

    public class TagPatchRequestDocumentValidatorcs : AbstractValidator<JsonPatchDocument<TagPatchRequest>>
    {
        public TagPatchRequestDocumentValidatorcs ()
        {
            RuleFor (tagPatchRequestDocument => tagPatchRequestDocument)
                .NotEmpty ();
        }
    }
}