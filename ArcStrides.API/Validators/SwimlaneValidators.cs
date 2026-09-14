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

            RuleFor (boardSwimlaneEnumerable => boardSwimlaneEnumerable.Select (swimlane => swimlane.GlobalSwimlaneOrder))
                .Must (ValidateDistinctGlobalSwimlaneOrder)
                .WithMessage ((_, globalOrders) =>
                    ValidatorMessages.DuplicateFieldValidatorMessage (nameof (Swimlane.GlobalSwimlaneOrder), globalOrders));

            RuleFor (boardSwimlaneEnumerable => boardSwimlaneEnumerable.Select (swimlane => swimlane.SwimlaneColor))
                .Must (ValidateDistinctSwimlaneColor)
                .WithMessage ((_, colors) =>
                    ValidatorMessages.DuplicateFieldValidatorMessage (nameof (Swimlane.SwimlaneColor), colors, StringComparer.InvariantCultureIgnoreCase));

            RuleFor (boardSwimlaneEnumerable => boardSwimlaneEnumerable.Select (swimlane => swimlane.GlobalSwimlaneColor))
                .Must (ValidateDistinctGlobalSwimlaneColor)
                .WithMessage ((_, globalColors) =>
                    ValidatorMessages.DuplicateFieldValidatorMessage (nameof (Swimlane.GlobalSwimlaneColor), globalColors, StringComparer.InvariantCultureIgnoreCase));
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