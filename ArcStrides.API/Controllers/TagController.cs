using ArcStrides.API.Mappers;
using ArcStrides.API.Messages;
using ArcStrides.API.Models;
using ArcStrides.API.Models.TagGroup;
using ArcStrides.API.Repositories;
using ArcStrides.API.Validators;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.JsonPatch.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace ArcStrides.API.Controllers;

[ApiController]
[Route ("arcstrides/tags")]
public class TagController : Controller
{
    private readonly ITagRepository _tagRepository;

    private readonly ITagMapper _tagMapper;

    public TagController (ITagRepository tagRepository,
                          ITagMapper tagMapper)
    {
        _tagRepository = tagRepository;

        _tagMapper = tagMapper;
    }

    [HttpGet ("{ID:guid}")]
    public async Task<ActionResult> FetchTag (Guid ID)
    {
        var tagCollection = await _tagRepository.QueryTagsAsync (tag => tag.PartitionKey == ID.ToString ());
        if (tagCollection.Count () is 0)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Tag)));
        if (tagCollection.Count () is not 1)
            return Problem (ErrorResponseMessages.TooManyEntitiesErrorResponse (nameof (Tag)));
        
        var tagToReturn = tagCollection.Single ();
        var tagResponse = _tagMapper.MapTagToTagResponse (tagToReturn);
        return Ok (tagResponse);
    }

    [HttpPost]
    public async Task<ActionResult> CreateTag ([FromBody] TagCreateRequest tagCreateRequest)
    {
        var validationResult = new TagValidators.TagCreateRequestValidator ().Validate (tagCreateRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (TagCreateRequest), validationResult.ToString ()));

        var parentExists = await _tagRepository.ParentExistsAsync (tagCreateRequest.ParentID, tagCreateRequest.TypeID);
        if (parentExists is false)
            return BadRequest (ErrorResponseMessages.NotFoundErrorResponse ("Parent"));

        var newTag = _tagMapper.MapTagCreateRequestToTag (tagCreateRequest);
        newTag.PartitionKey = Guid.NewGuid ().ToString ();

        await _tagRepository.AddTagAsync (newTag);
        /*if (databaseResponse.IsError)
            return Problem (ErrorResponseMessages.AddToDatabaseErrorResponse (nameof (Tag), databaseResponse.Status));*/

        var tagResponse = _tagMapper.MapTagToTagResponse (newTag);
        return Created (default (Uri), tagResponse);// Fix the Uri one day.
    }

    [HttpPatch ("{ID:guid}")]
    public async Task<ActionResult> UpdateTag (Guid ID, [FromBody] JsonPatchDocument<TagPatchRequest> tagPatchRequest)
    {
        var validationResult = new TagValidators.TagPatchRequestDocumentValidatorcs ().Validate (tagPatchRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (TagPatchRequest), validationResult.ToString ()));

        var tagToUpdateCollection = await _tagRepository.GetTagsAsync (ID);
        if (tagToUpdateCollection is null || tagToUpdateCollection.Count is 0)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Tag)));
        if (tagToUpdateCollection.Count is not 1)
            return Problem (ErrorResponseMessages.TooManyEntitiesErrorResponse (nameof (Tag)));
        
        var tagToUpdate = tagToUpdateCollection.Single ();
        var convertedTagToUpdate = _tagMapper.MapTagToTagPatchRequest (tagToUpdate);
        try { tagPatchRequest.ApplyTo (convertedTagToUpdate); }
        catch (JsonPatchException jsonPatchEx)
            { return BadRequest (ErrorResponseMessages.PatchRequestIsInvalidErrorResponse (nameof (Tag)) + "\nDetails:\n" + jsonPatchEx.Message); }

        tagToUpdate = _tagMapper.MapTagPatchRequestToTag (convertedTagToUpdate); // Make sure that the response object is preserved if not mapped to
        await _tagRepository.UpdateTagAsync (tagToUpdate);
        /*if (databaseResponse.IsError)
            return Problem (ErrorResponseMessages.UpdateInDatabaseErrorResponse (nameof (Tag), databaseResponse.Status));*/

        var tagResponse = _tagMapper.MapTagToTagResponse (tagToUpdate);
        return Ok (tagResponse);
    }

    [HttpDelete ("{ID:guid}")]
    public async Task<ActionResult> DeleteTag (Guid ID)
    {
        var tagCollection = await _tagRepository.QueryTagsAsync (tag => tag.PartitionKey == ID.ToString ());
        if (tagCollection.Count is 0)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (Tag)));
        if (tagCollection.Count is not 1)
            return Problem (ErrorResponseMessages.TooManyEntitiesErrorResponse (nameof (Tag)));
        
        var tagFromDatabase = tagCollection.Single ();
        await _tagRepository.DeleteTagAsync (tagFromDatabase);
        /*if (databaseResponse.IsError)
            return Problem (ErrorResponseMessages.RemoveFromDatabaseErrorResponse (nameof (Tag), databaseResponse.Status));*/

        return Ok ();
    }

    [HttpGet ("types/{ID:guid}")]
    public async Task<ActionResult> FetchTagTypeAsync (Guid ID)
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
    public async Task<ActionResult> FetchTagGroupAsync (Guid ID)
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

    [HttpGet ("groups/types/{ID:guid}")]
    public async Task<ActionResult> FetchTagGroupTypeAsync (Guid ID)
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