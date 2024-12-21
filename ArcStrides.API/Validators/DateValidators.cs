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
}