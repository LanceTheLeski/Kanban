using FluentValidation;
using Kanban.Contracts.Request.Create;

namespace Kanban.API.Validators;

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