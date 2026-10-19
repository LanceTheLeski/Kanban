using ArcStrides.API.Messages;
using ArcStrides.API.Models.Tag;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using FluentValidation;
using Microsoft.AspNetCore.JsonPatch.SystemTextJson;
using System.Text.RegularExpressions;

namespace ArcStrides.API.Validators;

public class TagValidators
{
    /// <summary>
    /// Whether a colour is one a tag can have: <c>#rrggbb</c>, as the colour picker
    /// writes it.
    /// </summary>
    public static bool IsColor (string color)
        => Regex.IsMatch (color, "^#[0-9A-Fa-f]{6}$");

    public class TagCreateRequestValidator : AbstractValidator<TagCreateRequest>
    {
        public TagCreateRequestValidator ()
        {
            RuleFor (tagCreateRequest => tagCreateRequest.ParentID)
                .NotEmpty ()
                .WithMessage (ValidatorMessages.EmptyFieldValidatorMessage (nameof (TagCreateRequest.ParentID)));

            // A title, unless the tag is named by its ID.
            RuleFor (tagCreateRequest => tagCreateRequest.Title)
                .NotEmpty ()
                .When (tagCreateRequest => tagCreateRequest.ID is null)
                .WithMessage (ValidatorMessages.EmptyFieldValidatorMessage (nameof (TagCreateRequest.Title)));

            // NotNull and a range rather than NotEmpty: 0 is a column, and NotEmpty
            // turned every tag on a column away as a missing type.
            RuleFor (tagCreateRequest => tagCreateRequest.TypeID)
                .NotNull ()
                .WithMessage (ValidatorMessages.EmptyFieldValidatorMessage (nameof (TagCreateRequest.TypeID)));

            RuleFor (tagCreateRequest => tagCreateRequest.TypeID)
                .InclusiveBetween (TagParentTypes.Column, TagParentTypes.Tag)
                .WithMessage (ValidatorMessages.FieldOutOfRangeValdiatorMessage (nameof (TagCreateRequest.TypeID)));
        }
    }

    public class DateTagCreateRequestValidator : AbstractValidator<DateTagCreateRequest>
    {
        public DateTagCreateRequestValidator ()
        {
            RuleFor (dateTagCreateRequest => dateTagCreateRequest.Title)
                .NotEmpty ()
                .When (dateTagCreateRequest => dateTagCreateRequest.ID is null)
                .WithMessage (ValidatorMessages.EmptyFieldValidatorMessage (nameof (DateTagCreateRequest.Title)));
        }
    }

    public class TagPatchRequestDocumentValidatorcs : AbstractValidator<JsonPatchDocument<TagPatchRequest>>
    {
        public TagPatchRequestDocumentValidatorcs ()
        {
            RuleFor (tagPatchRequestDocument => tagPatchRequestDocument)
                .NotEmpty ();
        }
    }
}