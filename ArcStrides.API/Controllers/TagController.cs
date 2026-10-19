using ArcStrides.API.Mappers;
using ArcStrides.API.Messages;
using ArcStrides.API.Models.Tag;
using ArcStrides.API.Models.TagGroup;
using ArcStrides.API.Repositories;
using ArcStrides.API.Validators;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using Microsoft.AspNetCore.JsonPatch.SystemTextJson;
using Microsoft.AspNetCore.JsonPatch.SystemTextJson.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace ArcStrides.API.Controllers;

[ApiController]
[Route ("arcstrides/tags")]
public class TagController : ArcController
{
    private readonly ITagRepository _tagRepository;

    private readonly TagMapper _tagMapper;

    public TagController (ITagRepository tagRepository,
                          TagMapper tagMapper)
    {
        _tagRepository = tagRepository;

        _tagMapper = tagMapper;
    }

    /// <summary>
    /// The tags there are — <c>GET arcstrides/tags</c> — each once, or with
    /// <c>?parentID=</c> the tags on one thing.
    /// </summary>
    /// <remarks>
    /// Without a parent this is the list the tag fields suggest from as you type,
    /// so a tag is put on by choosing it rather than retyped. Each tag is answered
    /// once, with no parent. The tags on a card or a task also arrive with it on
    /// the board, and a day's with the month; this is for anything else.
    /// </remarks>
    [HttpGet ("")]
    public async Task<ActionResult> FetchTags ([FromQuery] Guid? parentID)
    {
        if (parentID is Guid parent)
        {
            var labelsOnParent = await _tagRepository.GetLabelsOnParentAsync (parent);
            return Ok (labelsOnParent.Select (_tagMapper.MapTagToTagResponse));
        }

        var tags = (await _tagRepository.GetLabelsAsync ()).GroupBy (tag => tag.PartitionKey)
                                                             .Select (rows => rows.First ())
                                                             .OrderBy (tag => tag.Title, StringComparer.OrdinalIgnoreCase)
                                                             .Select (tag => new TagResponse
                                                             {
                                                                 ID = Guid.Parse (tag.PartitionKey!),
                                                                 Title = tag.Title,
                                                                 Color = tag.Color,
                                                             });
        return Ok (tags);
    }

    [HttpGet ("{ID:guid}")]
    public async Task<ActionResult> FetchTag (Guid ID)
    {
        var tagRows = await _tagRepository.GetLabelRowsAsync (ID);
        if (tagRows.Count is 0)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Tag)));

        // One row per thing the tag is on; the tag itself is the same on all of them.
        var tagResponse = new TagResponse
        {
            ID = ID,
            Title = tagRows.First ().Title,
            Color = tagRows.First ().Color,
        };
        return Ok (tagResponse);
    }

    /// <summary>
    /// Puts a tag on something — <c>POST arcstrides/tags</c> — making the tag if it
    /// is new. 201 when it was put on, 200 when it was on already.
    /// </summary>
    /// <remarks>
    /// The tag is the one named by ID, or else the one with this title, or else a
    /// new one; see TagRepository.AttachLabelAsync.
    /// </remarks>
    [HttpPost]
    public async Task<ActionResult> CreateTag ([FromBody] TagCreateRequest tagCreateRequest)
    {
        var validationResult = new TagValidators.TagCreateRequestValidator ().Validate (tagCreateRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (TagCreateRequest), validationResult.ToString ()));

        try
        {
            var parentExists = await _tagRepository.ParentExistsAsync (tagCreateRequest.ParentID!.Value, tagCreateRequest.TypeID!.Value);
            if (parentExists is false)
                return NotFound (ErrorResponseMessages.NotFoundErrorResponse ("Parent"));

            var attached = await _tagRepository.AttachLabelAsync (tagCreateRequest.ID, tagCreateRequest.Title, tagCreateRequest.ParentID.Value, tagCreateRequest.TypeID.Value);
            if (attached is null)
                return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Tag)));

            var tagResponse = _tagMapper.MapTagToTagResponse (attached.Value.Tag);
            return attached.Value.Created
                ? Created (default (Uri), tagResponse)
                : Ok (tagResponse);
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    /// <summary>
    /// Renames or recolours a tag everywhere it is — <c>PATCH arcstrides/tags/{ID}</c>.
    /// </summary>
    /// <remarks>
    /// The title and the colour are on every row of the tag, one per thing it is
    /// on, so every row is written. A colour is <c>#rrggbb</c>, or null for the
    /// default. This used to require exactly one row, and then wrote a Tag built
    /// from the patch alone, with no keys, which the table refused; a tag on two
    /// things could not be renamed at all, and one on one thing failed anyway.
    /// </remarks>
    [HttpPatch ("{ID:guid}")]
    public async Task<ActionResult> UpdateTag (Guid ID, [FromBody] JsonPatchDocument<TagPatchRequest> tagPatchRequest)
    {
        var validationResult = new TagValidators.TagPatchRequestDocumentValidatorcs ().Validate (tagPatchRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (TagPatchRequest), validationResult.ToString ()));

        try
        {
            var tagRows = await _tagRepository.GetLabelRowsAsync (ID);
            if (tagRows.Count is 0)
                return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Tag)));

            var convertedTagToUpdate = _tagMapper.MapTagToTagPatchRequest (tagRows.First ());
            try { tagPatchRequest.ApplyTo (convertedTagToUpdate); }
            catch (JsonPatchException)
                { return BadRequest (ErrorResponseMessages.PatchRequestIsInvalidErrorResponse (nameof (Tag))); }

            var newTitle = convertedTagToUpdate.Title?.Trim ();
            if (string.IsNullOrEmpty (newTitle))
                return BadRequest (ValidatorMessages.EmptyFieldValidatorMessage (nameof (TagPatchRequest.Title)));

            var newColor = convertedTagToUpdate.Color;
            if (newColor is not null && TagValidators.IsColor (newColor) is false)
                return BadRequest (ValidatorMessages.InvalidFieldValueFormatValidatorMessage (nameof (TagPatchRequest.Color)));

            var titleTaken = (await _tagRepository.GetLabelsAsync ()).Any (tag => tag.PartitionKey != ID.ToString ()
                                                                                   && string.Equals (tag.Title?.Trim (), newTitle, StringComparison.OrdinalIgnoreCase));
            if (titleTaken)
                return BadRequest (ValidatorMessages.DuplicateFieldValidatorMessage (nameof (Tag.Title)));

            foreach (var tagRow in tagRows)
            {
                tagRow.Title = newTitle;
                tagRow.Color = newColor;
                await _tagRepository.UpdateTagAsync (tagRow);
            }

            return Ok (new TagResponse { ID = ID, Title = newTitle, Color = newColor });
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    /// <summary>
    /// Deletes a tag from everything it is on — <c>DELETE arcstrides/tags/{ID}</c>.
    /// </summary>
    [HttpDelete ("{ID:guid}")]
    public async Task<ActionResult> DeleteTag (Guid ID)
    {
        try
        {
            var tagRows = await _tagRepository.GetLabelRowsAsync (ID);
            if (tagRows.Count is 0)
                return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Tag)));

            foreach (var tagRow in tagRows)
                await _tagRepository.DeleteTagAsync (tagRow);

            return Ok ();
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    /// <summary>
    /// Takes a tag off one thing — <c>DELETE arcstrides/tags/{ID}/parents/{parentID}</c>.
    /// The tag stays on everything else, and in the list of tags if it is on nothing
    /// now (TagRepository.DetachLabelAsync).
    /// </summary>
    [HttpDelete ("{ID:guid}/parents/{parentID:guid}")]
    public async Task<ActionResult> DeleteTagFromParent (Guid ID, Guid parentID)
    {
        try
        {
            var tagRow = (await _tagRepository.GetLabelsOnParentAsync (parentID)).FirstOrDefault (tag => tag.PartitionKey == ID.ToString ());
            if (tagRow is null)
                return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Tag)));

            await _tagRepository.DetachLabelAsync (tagRow);
            return Ok ();
        }
        catch (Exception ex)
            { return ArcErrorResponse (ex); }
    }

    [HttpGet ("types/{ID:guid}")]
    public async Task<ActionResult> FetchTagType (Guid ID)
    {
        var tagTypeCollection = await _tagRepository.QueryTagTypesAsync (tagType => tagType.PartitionKey == ID.ToString ());
        if (tagTypeCollection.Count is 0)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (TagType)));
        if (tagTypeCollection.Count is not 1)
            return Problem (ErrorResponseMessages.TooManyEntitiesErrorResponse (nameof (TagType)));

        var tagTypeToReturn = tagTypeCollection.Single ();
        var tagTypeResponse = _tagMapper.MapTagTypeToTagTypeResponse (tagTypeToReturn);
        return Ok (tagTypeResponse);
    }

    [HttpGet ("groups/{ID:guid}")]
    public async Task<ActionResult> FetchTagGroup ([FromRoute] Guid ID)
    {
        var tagGroupCollection = await _tagRepository.QueryTagGroupsAsync (tagGroup => tagGroup.PartitionKey == ID.ToString ());
        if (tagGroupCollection.Count is 0)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (TagGroup)));
        if (tagGroupCollection.Count is not 1)
            return Problem (ErrorResponseMessages.TooManyEntitiesErrorResponse (nameof (TagGroup)));

        var tagGroupToReturn = tagGroupCollection.Single ();
        var tagGroupResponse = _tagMapper.MapTagGroupToTagGroupResponse (tagGroupToReturn);
        return Ok (tagGroupResponse);
    }

    [HttpGet ("groups")]
    public async Task<ActionResult> FetchTagGroup ()//Todo: make this better at some point. I.e. make it follow a pattern where we query for multiple or all TagGroups
    {
        var tagGroupCollection = await _tagRepository.QueryTagGroupsAsync (tagGroup => true);

        var tagGroupCollectionResponse = new List<TagGroupResponse> ();
        foreach (var tagGroup in tagGroupCollection)
            tagGroupCollectionResponse.Add (_tagMapper.MapTagGroupToTagGroupResponse (tagGroup));
        return Ok (tagGroupCollectionResponse);
    }

    [HttpGet ("groups/types/{ID:guid}")]
    public async Task<ActionResult> FetchTagGroupType (Guid ID)
    {
        var tagGroupTypeCollection = await _tagRepository.QueryTagGroupTypesAsync (tagGroupType => tagGroupType.PartitionKey == ID.ToString ());
        if (tagGroupTypeCollection.Count is 0)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (TagGroupType)));
        if (tagGroupTypeCollection.Count is not 1)
            return Problem (ErrorResponseMessages.TooManyEntitiesErrorResponse (nameof (TagGroupType)));

        var tagGroupTypeToReturn = tagGroupTypeCollection.Single ();
        var tagTypeResponse = _tagMapper.MapTagGroupTypeToTagGroupTypeResponse (tagGroupTypeToReturn);
        return Ok (tagTypeResponse);
    }
}