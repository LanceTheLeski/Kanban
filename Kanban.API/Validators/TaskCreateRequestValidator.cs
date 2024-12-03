using FluentValidation;
using Kanban.Contracts.Request.Create;

namespace Kanban.API.Validators;

public class TaskCreateRequestValidator : AbstractValidator<TaskCreateRequest>
{
    public TaskCreateRequestValidator ()
    {
        RuleFor (taskCreateRequest => taskCreateRequest.CardID)
            .NotEmpty ();

        RuleFor (taskCreateRequest => taskCreateRequest.TaskTypeID)
            .NotEmpty ();

        RuleFor (taskCreateRequest => taskCreateRequest.Title)
            .NotEmpty ();
    }
}