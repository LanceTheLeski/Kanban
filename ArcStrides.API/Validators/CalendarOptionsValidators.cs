using ArcStrides.API.Messages;
using ArcStrides.Contracts.Request.Create;
using FluentValidation;

namespace ArcStrides.API.Validators;

public class CalendarOptionsValidators
{
    public class CalendarOptionsUpdateRequestValidator : AbstractValidator<CalendarOptionsUpdateRequest>
    {
        public CalendarOptionsUpdateRequestValidator ()
        {
            // Present, though it may be empty: a week can have no weekend.
            RuleFor (calendarOptionsUpdateRequest => calendarOptionsUpdateRequest.WeekendDays)
                .NotNull ()
                .WithMessage (ValidatorMessages.EmptyFieldValidatorMessage (nameof (CalendarOptionsUpdateRequest.WeekendDays)));

            RuleForEach (calendarOptionsUpdateRequest => calendarOptionsUpdateRequest.WeekendDays)
                .InclusiveBetween (0, 6)
                .WithMessage (ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (CalendarOptionsUpdateRequest.WeekendDays)));

            RuleFor (calendarOptionsUpdateRequest => calendarOptionsUpdateRequest.WeekendDateTypeID)
                .NotNull ()
                .GreaterThanOrEqualTo (0)
                .WithMessage (ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (CalendarOptionsUpdateRequest.WeekendDateTypeID)));

            RuleFor (calendarOptionsUpdateRequest => calendarOptionsUpdateRequest.WeekdayDateTypeID)
                .NotNull ()
                .GreaterThanOrEqualTo (0)
                .WithMessage (ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (CalendarOptionsUpdateRequest.WeekdayDateTypeID)));

            RuleForEach (calendarOptionsUpdateRequest => calendarOptionsUpdateRequest.DateTypes)
                .SetValidator (new DateTypeOptionsUpdateRequestValidator ());

            RuleFor (calendarOptionsUpdateRequest => calendarOptionsUpdateRequest.DateTypes)
                .Must (ValidateDistinctDateTypeIDs)
                .WithMessage (ValidatorMessages.DuplicateFieldValidatorMessage (nameof (DateTypeOptionsUpdateRequest.ID)));
        }

        private bool ValidateDistinctDateTypeIDs (IEnumerable<DateTypeOptionsUpdateRequest>? dateTypes)
            => dateTypes is null || dateTypes.Select (dateType => dateType.ID).Distinct ().Count () == dateTypes.Count ();
    }

    public class DateTypeOptionsUpdateRequestValidator : AbstractValidator<DateTypeOptionsUpdateRequest>
    {
        public DateTypeOptionsUpdateRequestValidator ()
        {
            // 0 is "no type", which has nothing to change.
            RuleFor (dateTypeOptionsUpdateRequest => dateTypeOptionsUpdateRequest.ID)
                .NotNull ()
                .GreaterThanOrEqualTo (1)
                .WithMessage (ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (DateTypeOptionsUpdateRequest.ID)));

            RuleFor (dateTypeOptionsUpdateRequest => dateTypeOptionsUpdateRequest.Scene)
                .MaximumLength (32)
                .WithMessage (ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (DateTypeOptionsUpdateRequest.Scene)));

            RuleFor (dateTypeOptionsUpdateRequest => dateTypeOptionsUpdateRequest.ShowsProgress)
                .NotNull ()
                .WithMessage (ValidatorMessages.EmptyFieldValidatorMessage (nameof (DateTypeOptionsUpdateRequest.ShowsProgress)));

            RuleFor (dateTypeOptionsUpdateRequest => dateTypeOptionsUpdateRequest.DefaultTaskTypeID)
                .GreaterThanOrEqualTo (0)
                .When (dateTypeOptionsUpdateRequest => dateTypeOptionsUpdateRequest.DefaultTaskTypeID is not null)
                .WithMessage (ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (DateTypeOptionsUpdateRequest.DefaultTaskTypeID)));
        }
    }
}
