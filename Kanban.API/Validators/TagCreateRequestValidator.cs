using FluentValidation;
using Kanban.API.Components;
using Kanban.Contracts.Request.Create;

namespace Kanban.API.Validators;

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