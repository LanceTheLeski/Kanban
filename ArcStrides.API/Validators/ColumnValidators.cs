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

            /*
               Three rules used to live here, requiring ColumnColor,
               GlobalColumnColor and GlobalColumnOrder to be distinct across a
               board. Nothing in the codebase ever writes any of those three -- not
               the create request, not the mapper, not any controller -- so every row
               carried the same unset value and the rules could only pass on a board
               with a single column. Two of anything made the board unreadable,
               and because this validation runs on the *read* path there was no way to
               get back in and repair it.

               They were also asking for the wrong thing. Uniqueness belongs to
               identity and position -- the ID, the title, the order -- which are the
               rules that remain. A colour is presentation, and two columns
               sharing one is a legitimate board, not a corrupt one. GlobalColumnOrder
               is for a feature that is not built yet ("quickly create a board on the
               fly"); a uniqueness constraint on an unimplemented field can only ever
               be satisfied by accident.

               If distinct colours are wanted later, that is a job for the create path
               -- assign one -- not for a read that refuses to return the board.
            */
        }

        private bool ValidateColumnIDsAreGuids (IEnumerable<string?> columnIDs)
            => columnIDs.All (columnID => Guid.TryParse (columnID, out var _));

        private bool ValidateDistinctColumnID (IEnumerable<string?> columnIDs)
            => columnIDs.Distinct ().Count () == columnIDs.Count ();

        private bool ValidateDistinceColumnTitle (IEnumerable<string?> columnTitles)
           => columnTitles.Distinct (StringComparer.InvariantCultureIgnoreCase).Count () == columnTitles.Count ();

        private bool ValidateDistinctColumnOrder (IEnumerable<int?> columnOrders)
            => columnOrders.Distinct ().Count() == columnOrders.Count();

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
