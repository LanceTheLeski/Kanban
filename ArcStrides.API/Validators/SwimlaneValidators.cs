using ArcStrides.API.Messages;
using ArcStrides.API.Models.Board;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using FluentValidation;
using Microsoft.AspNetCore.JsonPatch;

namespace ArcStrides.API.Validators;

public class SwimlaneValidators
{
    public class BoardSwimlaneEnumerableValidator : AbstractValidator<IEnumerable<Swimlane>>
    {
        public BoardSwimlaneEnumerableValidator ()
        {
            RuleFor (boardSwimlaneEnumerable => boardSwimlaneEnumerable.Select (swimlane => swimlane.RowKey))
                .Must (ValidateSwimlaneIDsAreGuids)
                .WithMessage ("Todo 1");

            RuleFor (boardSwimlaneEnumerable => boardSwimlaneEnumerable.Select (swimlane => swimlane.RowKey))
                .Must (ValidateDistinctSwimlaneID)
                .WithMessage ("Todo 2");

            RuleFor (boardSwimlaneEnumerable => boardSwimlaneEnumerable.Select (swimlane => swimlane.Title))
                .Must (ValidateDistinceSwimlaneTitle)
                .WithMessage ("Todo 3");

            RuleFor (boardSwimlaneEnumerable => boardSwimlaneEnumerable.Select (swimlane => swimlane.SwimlaneOrder))
                .Must (ValidateDistinctSwimlaneOrder)
                .WithMessage ("Todo 4");

            RuleFor (boardSwimlaneEnumerable => boardSwimlaneEnumerable.Select (swimlane => swimlane.GlobalSwimlaneOrder))
                .Must (ValidateDistinctGlobalSwimlaneOrder)
                .WithMessage ("Todo 5");

            RuleFor (boardSwimlaneEnumerable => boardSwimlaneEnumerable.Select (swimlane => swimlane.SwimlaneColor))
                .Must (ValidateDistinctSwimlaneColor)
                .WithMessage ("Todo 6");

            RuleFor (boardSwimlaneEnumerable => boardSwimlaneEnumerable.Select (swimlane => swimlane.GlobalSwimlaneColor))
                .Must (ValidateDistinctGlobalSwimlaneColor)
                .WithMessage ("Todo 7");
        }

        private bool ValidateSwimlaneIDsAreGuids (IEnumerable<string?> swimlaneIDs)
            => swimlaneIDs.All (swimlaneID => Guid.TryParse (swimlaneID, out var _));

        private bool ValidateDistinctSwimlaneID (IEnumerable<string?> swimlaneIDs)
            => swimlaneIDs.Distinct ().Count () == swimlaneIDs.Count ();

        private bool ValidateDistinceSwimlaneTitle (IEnumerable<string?> swimlaneTitles)
           => swimlaneTitles.Distinct (StringComparer.InvariantCultureIgnoreCase).Count () == swimlaneTitles.Count ();

        private bool ValidateDistinctSwimlaneOrder (IEnumerable<int> swimlaneOrders)
            => swimlaneOrders.Distinct ().Count () == swimlaneOrders.Count ();

        private bool ValidateDistinctGlobalSwimlaneOrder (IEnumerable<double> globalSwimlaneOrders)
            => globalSwimlaneOrders.Distinct ().Count () == globalSwimlaneOrders.Count ();

        private bool ValidateDistinctSwimlaneColor (IEnumerable<string?> swimlaneColors)
            => swimlaneColors.Distinct (StringComparer.InvariantCultureIgnoreCase).Count () == swimlaneColors.Count ();

        private bool ValidateDistinctGlobalSwimlaneColor (IEnumerable<string?> swimlaneColors)
            => swimlaneColors.Distinct (StringComparer.InvariantCultureIgnoreCase).Count () == swimlaneColors.Count ();
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