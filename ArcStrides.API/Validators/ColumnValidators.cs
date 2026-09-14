using ArcStrides.API.Messages;
using ArcStrides.API.Models.Board;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using FluentValidation;
using Microsoft.AspNetCore.JsonPatch.SystemTextJson;

namespace ArcStrides.API.Validators;

public class ColumnValidators
{
    public class BoardColumnEnumerableValidator : AbstractValidator<IEnumerable<Column>>
    {
        public BoardColumnEnumerableValidator ()
        {
            RuleFor (boardColumnEnumerable => boardColumnEnumerable.Select (column => column.RowKey))
                .Must (ValidateColumnIDsAreGuids)
                .WithMessage (ValidatorMessages.InvalidFieldValueFormatValidatorMessage (nameof (Column.RowKey)));

            RuleFor (boardColumnEnumerable => boardColumnEnumerable.Select (column => column.RowKey))
                .Must (ValidateDistinctColumnID)
                .WithMessage ((_, ids) =>
                    ValidatorMessages.DuplicateFieldValidatorMessage (nameof (Column.RowKey), ids));

            RuleFor (boardColumnEnumerable => boardColumnEnumerable.Select (column => column.Title))
                .Must (ValidateDistinceColumnTitle)
                .WithMessage ((_, titles) =>
                    ValidatorMessages.DuplicateFieldValidatorMessage (nameof (Column.Title), titles, StringComparer.InvariantCultureIgnoreCase));

            RuleFor (boardColumnEnumerable => boardColumnEnumerable.Select (column => column.ColumnOrder))
                .Must (ValidateDistinctColumnOrder)
                .WithMessage ((_, orders) =>
                    ValidatorMessages.DuplicateFieldValidatorMessage (nameof (Column.ColumnOrder), orders));

            RuleFor (boardColumnEnumerable => boardColumnEnumerable.Select (column => column.GlobalColumnOrder))
                .Must (ValidateDistinctGlobalColumnOrder)
                .WithMessage ((_, globalOrders) =>
                    ValidatorMessages.DuplicateFieldValidatorMessage (nameof (Column.GlobalColumnOrder), globalOrders));

            RuleFor (boardColumnEnumerable => boardColumnEnumerable.Select (column => column.ColumnColor))
                .Must (ValidateDistinctColumnColor)
                .WithMessage ((_, colors) =>
                    ValidatorMessages.DuplicateFieldValidatorMessage (nameof (Column.ColumnColor), colors, StringComparer.InvariantCultureIgnoreCase));

            RuleFor (boardColumnEnumerable => boardColumnEnumerable.Select (column => column.GlobalColumnColor))
                .Must (ValidateDistinctGlobalColumnColor)
                .WithMessage ((_, globalColors) =>
                    ValidatorMessages.DuplicateFieldValidatorMessage (nameof (Column.GlobalColumnColor), globalColors, StringComparer.InvariantCultureIgnoreCase));
        }

        private bool ValidateColumnIDsAreGuids (IEnumerable<string?> columnIDs)
            => columnIDs.All (columnID => Guid.TryParse (columnID, out var _));

        private bool ValidateDistinctColumnID (IEnumerable<string?> columnIDs)
            => columnIDs.Distinct ().Count () == columnIDs.Count ();

        private bool ValidateDistinceColumnTitle (IEnumerable<string?> columnTitles)
           => columnTitles.Distinct (StringComparer.InvariantCultureIgnoreCase).Count () == columnTitles.Count ();

        private bool ValidateDistinctColumnOrder (IEnumerable<int?> columnOrders)
            => columnOrders.Distinct ().Count() == columnOrders.Count();

        private bool ValidateDistinctGlobalColumnOrder (IEnumerable<double?> globalColumnOrders)
            => globalColumnOrders.Distinct ().Count () == globalColumnOrders.Count ();

        private bool ValidateDistinctColumnColor (IEnumerable<string?> columnColors)
            => columnColors.Distinct (StringComparer.InvariantCultureIgnoreCase).Count () == columnColors.Count ();

        private bool ValidateDistinctGlobalColumnColor (IEnumerable<string?> columnColors)
            => columnColors.Distinct (StringComparer.InvariantCultureIgnoreCase).Count () == columnColors.Count ();
    }

    public class ColumnCreateRequestValidator : AbstractValidator<ColumnCreateRequest>
    {
        public ColumnCreateRequestValidator ()
        {
            RuleFor (columnCreateRequest => columnCreateRequest.Title)
                .NotEmpty ()
                .WithMessage (ValidatorMessages.EmptyFieldValidatorMessage (nameof (ColumnCreateRequest.Title)));

            RuleFor (columnCreateRequest => columnCreateRequest.Order)
                .NotNull ();
        }
    }

    public class ColumnPatchRequestDocumentValidator : AbstractValidator<JsonPatchDocument<ColumnPatchRequest>>
    {
        public ColumnPatchRequestDocumentValidator ()
        {
            RuleFor (columnUpdateRequestDocument => columnUpdateRequestDocument)
                .NotEmpty ();
        }
    }
}
