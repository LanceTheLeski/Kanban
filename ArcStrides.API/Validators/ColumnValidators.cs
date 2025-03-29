using ArcStrides.API.Messages;
using ArcStrides.API.Models.Board;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using FluentValidation;
using Microsoft.AspNetCore.JsonPatch;

namespace ArcStrides.API.Validators;

public class ColumnValidators
{
    public class BoardColumnEnumerableValidator : AbstractValidator<IEnumerable<Column>>
    {
        public BoardColumnEnumerableValidator ()
        {
            RuleFor (boardColumnEnumerable => boardColumnEnumerable.Select (column => column.RowKey))
                .Must (ValidateColumnIDsAreGuids)
                .WithMessage ("Todo 1");

            RuleFor (boardColumnEnumerable => boardColumnEnumerable.Select (column => column.RowKey))
                .Must (ValidateDistinctColumnID)
                .WithMessage ("Todo 2");

            RuleFor (boardColumnEnumerable => boardColumnEnumerable.Select (column => column.Title))
                .Must (ValidateDistinceColumnTitle)
                .WithMessage ("Todo 3");

            RuleFor (boardColumnEnumerable => boardColumnEnumerable.Select (column => column.ColumnOrder))
                .Must (ValidateDistinctColumnOrder)
                .WithMessage ("Todo 4");

            RuleFor (boardColumnEnumerable => boardColumnEnumerable.Select (column => column.GlobalColumnOrder))
                .Must (ValidateDistinctGlobalColumnOrder)
                .WithMessage ("Todo 5");

            RuleFor (boardColumnEnumerable => boardColumnEnumerable.Select (column => column.ColumnColor))
                .Must (ValidateDistinctColumnColor)
                .WithMessage ("Todo 6");

            RuleFor (boardColumnEnumerable => boardColumnEnumerable.Select (column => column.GlobalColumnColor))
                .Must (ValidateDistinctGlobalColumnColor)
                .WithMessage ("Todo 7");
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
