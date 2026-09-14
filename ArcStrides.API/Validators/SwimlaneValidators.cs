using ArcStrides.API.Messages;
using ArcStrides.API.Models.Board;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using FluentValidation;
using Microsoft.AspNetCore.JsonPatch.SystemTextJson;

namespace ArcStrides.API.Validators;

public class SwimlaneValidators
{
    public class BoardSwimlaneEnumerableValidator : AbstractValidator<IEnumerable<Swimlane>>
    {
        public BoardSwimlaneEnumerableValidator ()
        {
            RuleFor (boardSwimlaneEnumerable => boardSwimlaneEnumerable.Select (swimlane => swimlane.RowKey))
                .Must (ValidateSwimlaneIDsAreGuids)
                .WithMessage (ValidatorMessages.InvalidFieldValueFormatValidatorMessage (nameof (Swimlane.RowKey)));

            RuleFor (boardSwimlaneEnumerable => boardSwimlaneEnumerable.Select (swimlane => swimlane.RowKey))
                .Must (ValidateDistinctSwimlaneID)
                .WithMessage ((_, ids) =>
                    ValidatorMessages.DuplicateFieldValidatorMessage (nameof (Swimlane.RowKey), ids));

            RuleFor (boardSwimlaneEnumerable => boardSwimlaneEnumerable.Select (swimlane => swimlane.Title))
                .Must (ValidateDistinceSwimlaneTitle)
                .WithMessage ((_, titles) =>
                    ValidatorMessages.DuplicateFieldValidatorMessage (nameof (Swimlane.Title), titles, StringComparer.InvariantCultureIgnoreCase));

            RuleFor (boardSwimlaneEnumerable => boardSwimlaneEnumerable.Select (swimlane => swimlane.SwimlaneOrder))
                .Must (ValidateDistinctSwimlaneOrder)
                .WithMessage ((_, orders) =>
                    ValidatorMessages.DuplicateFieldValidatorMessage (nameof (Swimlane.SwimlaneOrder), orders));

            /*
               Three rules used to live here, requiring SwimlaneColor,
               GlobalSwimlaneColor and GlobalSwimlaneOrder to be distinct across a
               board. Nothing in the codebase ever writes any of those three -- not
               the create request, not the mapper, not any controller -- so every row
               carried the same unset value and the rules could only pass on a board
               with a single swimlane. Two of anything made the board unreadable,
               and because this validation runs on the *read* path there was no way to
               get back in and repair it.

               They were also asking for the wrong thing. Uniqueness belongs to
               identity and position -- the ID, the title, the order -- which are the
               rules that remain. A colour is presentation, and two swimlanes
               sharing one is a legitimate board, not a corrupt one. GlobalSwimlaneOrder
               is for a feature that is not built yet ("quickly create a board on the
               fly"); a uniqueness constraint on an unimplemented field can only ever
               be satisfied by accident.

               If distinct colours are wanted later, that is a job for the create path
               -- assign one -- not for a read that refuses to return the board.
            */
        }

        private bool ValidateSwimlaneIDsAreGuids (IEnumerable<string?> swimlaneIDs)
            => swimlaneIDs.All (swimlaneID => Guid.TryParse (swimlaneID, out var _));

        private bool ValidateDistinctSwimlaneID (IEnumerable<string?> swimlaneIDs)
            => swimlaneIDs.Distinct ().Count () == swimlaneIDs.Count ();

        private bool ValidateDistinceSwimlaneTitle (IEnumerable<string?> swimlaneTitles)
           => swimlaneTitles.Distinct (StringComparer.InvariantCultureIgnoreCase).Count () == swimlaneTitles.Count ();

        private bool ValidateDistinctSwimlaneOrder (IEnumerable<int> swimlaneOrders)
            => swimlaneOrders.Distinct ().Count () == swimlaneOrders.Count ();

    }

    public class SwimlaneCreateRequestValidator : AbstractValidator<SwimlaneCreateRequest>
    {
        public SwimlaneCreateRequestValidator ()
        {
            RuleFor (swimlaneCreateRequest => swimlaneCreateRequest.Title)
                .NotEmpty ()
                .WithMessage (ValidatorMessages.EmptyFieldValidatorMessage (nameof (SwimlaneCreateRequest.Title)));

            RuleFor (swimlaneCreateRequest => swimlaneCreateRequest.Order)
                .NotNull ();
        }
    }

    public class SwimlanePatchRequestDocumentValidator : AbstractValidator<JsonPatchDocument<SwimlanePatchRequest>>
    {
        public SwimlanePatchRequestDocumentValidator ()
        {
            RuleFor (swimlaneUpdateRequestDocument => swimlaneUpdateRequestDocument)
                .NotEmpty ();
        }
    }
}