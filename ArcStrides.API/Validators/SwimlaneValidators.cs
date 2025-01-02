using ArcStrides.API.Messages;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using FluentValidation;
using Microsoft.AspNetCore.JsonPatch;

namespace ArcStrides.API.Validators;

public class SwimlaneValidators
{
    public class SwimlaneCreateRequestValidator : AbstractValidator<SwimlaneCreateRequest>
    {
        public SwimlaneCreateRequestValidator ()
        {
            RuleFor (swimlaneCreateRequest => swimlaneCreateRequest.Title)
                .NotEmpty ()
                .WithMessage (ValidatorMessages.EmptyFieldValidatorMessage (nameof (SwimlaneCreateRequest.Title)));

            RuleFor (swimlaneCreateRequest => swimlaneCreateRequest.Order)
                .NotNull ();
        }
    }

    public class SwimlanePatchRequestDocumentValidator : AbstractValidator<JsonPatchDocument<SwimlanePatchRequest>>
    {
        public SwimlanePatchRequestDocumentValidator ()
        {
            RuleFor (swimlaneUpdateRequestDocument => swimlaneUpdateRequestDocument)
                .NotEmpty ();
        }
    }
}