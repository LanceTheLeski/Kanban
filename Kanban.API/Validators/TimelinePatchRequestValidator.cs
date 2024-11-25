using FluentValidation;
using Kanban.Contracts.Request.Patch;

namespace Kanban.API.Validators;

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