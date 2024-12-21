using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using FluentValidation;
using Microsoft.AspNetCore.JsonPatch;

namespace ArcStrides.API.Validators;

public class TimelineValidators
{
    public class TimelineCreateRequestValidator : AbstractValidator<TimelineCreateRequest>
    {
        public TimelineCreateRequestValidator ()
        {
            RuleFor (timelineCreateRequest => timelineCreateRequest)
                .Must (HaveValidStartTimeSequence);
        }

        private bool HaveValidStartTimeSequence (TimelineCreateRequest timelineCreateRequest)
        {
            if (timelineCreateRequest.StartPreferenceUTC > timelineCreateRequest.StartDeadlineUTC
                || timelineCreateRequest.StartPreferenceUTC > timelineCreateRequest.EndPreferenceUTC
                || timelineCreateRequest.StartPreferenceUTC > timelineCreateRequest.EndDeadlineUTC

                || timelineCreateRequest.StartDeadlineUTC > timelineCreateRequest.EndPreferenceUTC
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
        }

        private bool HaveValidStartTimeSequence (TimelinePatchRequest timelinePatchRequest)
        {
            if (timelinePatchRequest.StartPreferenceUTC > timelinePatchRequest.StartDeadlineUTC
                || timelinePatchRequest.StartPreferenceUTC > timelinePatchRequest.EndPreferenceUTC
                || timelinePatchRequest.StartPreferenceUTC > timelinePatchRequest.EndDeadlineUTC

                || timelinePatchRequest.StartDeadlineUTC > timelinePatchRequest.EndPreferenceUTC
                || timelinePatchRequest.StartDeadlineUTC > timelinePatchRequest.EndDeadlineUTC

                || timelinePatchRequest.EndPreferenceUTC > timelinePatchRequest.EndDeadlineUTC)
                return false;

            return true;
        }
    }
}