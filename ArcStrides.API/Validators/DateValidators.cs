using ArcStrides.Contracts.Request.Create;
using FluentValidation;

namespace ArcStrides.API.Calendars.Validators;

public class DateValidators
{
    public class DateCreateRequestValidator : AbstractValidator<DateCreateRequest>
    {
        public DateCreateRequestValidator ()
        {

        }
    }

    public class DateTypeUpdateRequestValidator : AbstractValidator<DateTypeUpdateRequest>
    {
        public DateTypeUpdateRequestValidator ()
        {
            RuleFor (dateTypeUpdateRequest => dateTypeUpdateRequest.DateTypeID)
                .NotNull ()
                .GreaterThanOrEqualTo (0);
        }
    }

    public class DateCardCreateRequestValidator : AbstractValidator<DateCardCreateRequest>
    {
        public DateCardCreateRequestValidator ()
        {
            RuleFor (dateCardCreateRequest => dateCardCreateRequest.CardID)
                .NotEmpty ();
        }
    }
}