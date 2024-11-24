using FluentValidation;
using Kanban.API.Components;
using Kanban.Contracts.Request.Create;

namespace Kanban.API.Validators;

// On principle, I think validation can take as many queries as needed. We shouldn't worry about having a single transaction for these.
public class ColumnCreateRequestValidator : AbstractValidator<ColumnCreateRequest>
{
    public ColumnCreateRequestValidator ()
    {
        RuleFor (columnCreateRequest => columnCreateRequest.Title)
            .NotEmpty ()
            .WithMessage (ValidatorMessages.EmptyFieldValidatorMessage (nameof (ColumnCreateRequest.Title)));

        RuleFor (columnCreateRequest => columnCreateRequest.Order)
            .NotNull ();

        RuleFor (columnCreateRequest => columnCreateRequest.BoardID)
            .NotEmpty ();
    }
}