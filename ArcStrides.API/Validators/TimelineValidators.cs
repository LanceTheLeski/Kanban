using ArcStrides.API.Messages;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using FluentValidation;
using Microsoft.AspNetCore.JsonPatch.SystemTextJson;

namespace ArcStrides.API.Validators;

public class TimelineValidators
{
    /// <summary>
    /// The longest a point may last: a week. A duration is how long something takes
    /// from its point, and longer than that it is a timeline of its own.
    /// </summary>
    private const int maxDurationMinutes = 7 * 24 * 60;

    public class TimelineCreateRequestValidator : AbstractValidator<TimelineCreateRequest>
    {
        public TimelineCreateRequestValidator ()
        {
            RuleFor (timelineCreateRequest => timelineCreateRequest)
                .Must (HaveValidStartTimeSequence);

            RuleFor (timelineCreateRequest => timelineCreateRequest.StartPreferenceDurationMinutes)
                .InclusiveBetween (1, maxDurationMinutes)
                .WithMessage (ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (TimelineCreateRequest.StartPreferenceDurationMinutes)));

            RuleFor (timelineCreateRequest => timelineCreateRequest.StartDeadlineDurationMinutes)
                .InclusiveBetween (1, maxDurationMinutes)
                .WithMessage (ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (TimelineCreateRequest.StartDeadlineDurationMinutes)));

            RuleFor (timelineCreateRequest => timelineCreateRequest.EndPreferenceDurationMinutes)
                .InclusiveBetween (1, maxDurationMinutes)
                .WithMessage (ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (TimelineCreateRequest.EndPreferenceDurationMinutes)));

            RuleFor (timelineCreateRequest => timelineCreateRequest.EndDeadlineDurationMinutes)
                .InclusiveBetween (1, maxDurationMinutes)
                .WithMessage (ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (TimelineCreateRequest.EndDeadlineDurationMinutes)));
        }

        private bool HaveValidStartTimeSequence (TimelineCreateRequest timelineCreateRequest)
        {
            if (timelineCreateRequest.StartPreferenceUTC > timelineCreateRequest.StartDeadlineUTC
                || timelineCreateRequest.StartPreferenceUTC > timelineCreateRequest.EndPreferenceUTC
                || timelineCreateRequest.StartPreferenceUTC > timelineCreateRequest.EndDeadlineUTC

                //|| timelineCreateRequest.StartDeadlineUTC > timelineCreateRequest.EndPreferenceUTC
                || timelineCreateRequest.StartDeadlineUTC > timelineCreateRequest.EndDeadlineUTC

                || timelineCreateRequest.EndPreferenceUTC > timelineCreateRequest.EndDeadlineUTC)
                return false;

            return true;
        }
    }

    public class TimelinePatchRequestDocumentValidator : AbstractValidator<JsonPatchDocument<TimelinePatchRequest>>
    {
        public TimelinePatchRequestDocumentValidator ()
        {
            RuleFor (timelinePatchRequestDocument => timelinePatchRequestDocument)
                .NotEmpty ();

            //Perhaps we should apply the patch and then do more validation?
        }
    }

    public class TimelinePatchRequestValidator : AbstractValidator<TimelinePatchRequest>
    {
        public TimelinePatchRequestValidator ()
        {
            RuleFor (timelinePatchRequest => timelinePatchRequest)
                .Must (HaveValidStartTimeSequence);

            RuleFor (timelinePatchRequest => timelinePatchRequest.StartPreferenceDurationMinutes)
                .InclusiveBetween (1, maxDurationMinutes)
                .WithMessage (ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (TimelinePatchRequest.StartPreferenceDurationMinutes)));

            RuleFor (timelinePatchRequest => timelinePatchRequest.StartDeadlineDurationMinutes)
                .InclusiveBetween (1, maxDurationMinutes)
                .WithMessage (ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (TimelinePatchRequest.StartDeadlineDurationMinutes)));

            RuleFor (timelinePatchRequest => timelinePatchRequest.EndPreferenceDurationMinutes)
                .InclusiveBetween (1, maxDurationMinutes)
                .WithMessage (ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (TimelinePatchRequest.EndPreferenceDurationMinutes)));

            RuleFor (timelinePatchRequest => timelinePatchRequest.EndDeadlineDurationMinutes)
                .InclusiveBetween (1, maxDurationMinutes)
                .WithMessage (ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (TimelinePatchRequest.EndDeadlineDurationMinutes)));
        }

        //Something is wrong here. Re-analyze this.
        private bool HaveValidStartTimeSequence (TimelinePatchRequest timelinePatchRequest)
        {
            if (timelinePatchRequest.StartPreferenceUTC > timelinePatchRequest.StartDeadlineUTC
                || timelinePatchRequest.StartPreferenceUTC > timelinePatchRequest.EndPreferenceUTC
                || timelinePatchRequest.StartPreferenceUTC > timelinePatchRequest.EndDeadlineUTC

                //|| timelinePatchRequest.StartDeadlineUTC > timelinePatchRequest.EndPreferenceUTC
                || timelinePatchRequest.StartDeadlineUTC > timelinePatchRequest.EndDeadlineUTC

                || timelinePatchRequest.EndPreferenceUTC > timelinePatchRequest.EndDeadlineUTC)
                return false;

            return true;
        }
    }
}