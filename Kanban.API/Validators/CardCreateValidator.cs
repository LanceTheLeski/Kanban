using FluentValidation;
using Kanban.Contracts.Request.Create;

namespace Kanban.API.Validators;

// On principle, I think validation can take as many queries as needed. We shouldn't worry about having a single transaction for these.
public class CardCreateValidator : AbstractValidator<CardCreateRequest>
{
    public CardCreateValidator ()
    {
        RuleFor (cardCreateRequest => cardCreateRequest.Title)
            .NotEmpty ();

        RuleFor (cardCreateRequest => cardCreateRequest.BoardID)
            .NotEmpty ()
            .Must (HaveValidBoardID);

        RuleFor (cardCreateRequest => cardCreateRequest.ColumnID)
            .NotEmpty ()
            .Must (HaveValidColumnID);

        RuleFor (cardCreateRequest => cardCreateRequest.SwimlaneID)
            .NotEmpty ()
            .Must (HaveValidSwimlaneID);
    }

    // Find the first record that works
    private bool HaveValidBoardID (Guid boardID)
    {
        return true;
    }

    // Must be under the board as well
    private bool HaveValidColumnID (Guid boardID)
    {
        return true;
    }

    // Must be under the board as well
    private bool HaveValidSwimlaneID (Guid boardID)
    {
        return true;
    }
}