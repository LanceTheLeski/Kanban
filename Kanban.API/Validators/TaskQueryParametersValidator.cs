using FluentValidation;
using Kanban.API.Components;
using Kanban.Contracts.Request.Query;

namespace Kanban.API.Validators;

public class TaskQueryParametersValidator : AbstractValidator<TaskQueryParameters>
{
    public TaskQueryParametersValidator ()
    {
        RuleFor (taskQueryParameters => taskQueryParameters.CardIDs)
            .Must (HaveValidCommaSeparatedGuidList)
            .WithMessage (ValidatorMessages.InvalidFieldValueFormatValidatorMessage (nameof (TaskQueryParameters.CardIDs)));
    }

    private bool HaveValidCommaSeparatedGuidList (string cardIDs)
    {
        if (string.IsNullOrWhiteSpace (cardIDs))
            return true;

        try
        {
            cardIDs.Split (',')
                   .Select (Guid.Parse);
        }
        catch (FormatException)
            { return false; }

        return true;
    }
}