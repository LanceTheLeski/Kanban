using ArcStrides.API.Messages;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Query;
using FluentValidation;

namespace ArcStrides.API.Validators;

public class TaskValidators
{
    /*public class TaskQueryParametersValidator : AbstractValidator<TaskQueryParameters>
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
    }*/

    public class TaskCreateRequestValidator : AbstractValidator<TaskCreateRequest>
    {
        public TaskCreateRequestValidator ()
        {
            RuleFor (taskCreateRequest => taskCreateRequest.TaskTypeID)
                .NotEmpty ();

            RuleFor (taskCreateRequest => taskCreateRequest.Title)
                .NotEmpty ();
        }
    }
}