using FluentValidation;
using ArcStrides.Contracts.Request.Create;

namespace ArcStrides.API.Validators;

public class CardValidators
{
    public class CardCreateRequestValidator : AbstractValidator<CardCreateRequest>
    {
        public CardCreateRequestValidator ()
        {
            RuleFor (cardCreateRequest => cardCreateRequest.Title)
                .NotEmpty ();
        }
    }
}