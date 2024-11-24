using FluentValidation;
using Kanban.API.Components;
using Kanban.API.Mappers;
using Kanban.API.Models;
using Kanban.API.Repositories;
using Kanban.Contracts.Request.Create;
using Kanban.Contracts.Request.Patch;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.JsonPatch.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace Kanban.API.Controllers;

[ApiController]
[Route ("kanban/tags")]
public class TagController : Controller
{
    private readonly IValidator<TagCreateRequest> _tagCreateRequestValidator;
    private readonly IValidator<JsonPatchDocument<TagPatchRequest>> _tagPatchRequestDocumentValidator;

    private readonly ITagRepository _tagRepository;
    private readonly ITagTypeRepository _tagTypeRepository;
    private readonly ITagGroupRepository _tagGroupRepository;
    private readonly ITagGroupTypeRepository _tagGroupTypeRepository;

    private readonly ITagMapper _tagMapper;

    public TagController (IValidator<TagCreateRequest> tagCreateRequestValidator,
                          IValidator<JsonPatchDocument<TagPatchRequest>> tagPatchRequestDocumentValidator,
                          ITagRepository tagRepository,
                          ITagTypeRepository tagTypeRepository,
                          ITagMapper tagMapper)
    {
        _tagCreateRequestValidator = tagCreateRequestValidator;
        _tagPatchRequestDocumentValidator = tagPatchRequestDocumentValidator;

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
        var validationResult = _tagCreateRequestValidator.Validate (tagCreateRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (TagCreateRequest))
                               + "\n" + validationResult.ToString ());

        var parentExists = await _tagRepository.ParentExistsAsync (tagCreateRequest.ParentID, tagCreateRequest.TypeID);
        if (parentExists is false)
            return BadRequest (ErrorResponseMessages.NotFoundErrorResponse ("Parent"));

        var newTag = _tagMapper.MapTagCreateRequestToTag (tagCreateRequest);
        newTag.PartitionKey = Guid.NewGuid ().ToString ();

        var databaseResponse = await _tagRepository.AddTagAsync (newTag);
        if (databaseResponse.IsError)
            return Problem (ErrorResponseMessages.AddToDatabaseErrorResponse (nameof (Tag)) + $"\nInternal status: {databaseResponse.Status}");

        var tagResponse = _tagMapper.MapTagToTagResponse (newTag);
        return Created (default (Uri), tagResponse);
    }

    [HttpPatch ("{ID:guid}")]
    public async Task<ActionResult> UpdateTag (Guid ID, [FromBody] JsonPatchDocument<TagPatchRequest> tagPatchRequest)
    {
        var validationResult = _tagPatchRequestDocumentValidator.Validate (tagPatchRequest);
        if (validationResult.IsValid is false)
            return BadRequest (ErrorResponseMessages.ValidationFailedErrorResponse (nameof (TagPatchRequest))
                               + "\n" + validationResult.ToString ());

        var tagToUpdateCollection = await _tagRepository.QueryTagsAsync (tag => tag.PartitionKey == ID.ToString ());
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
        var databaseResponse = await _tagRepository.UpdateTagAsync (tagToUpdate);
        if (databaseResponse.IsError)
            return Problem (ErrorResponseMessages.UpdateInDatabaseErrorResponse(nameof (Tag)) + $"\nInternal status: {databaseResponse.Status}");

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
        var databaseResponse = await _tagRepository.DeleteTagAsync (tagFromDatabase);
        if (databaseResponse.IsError)
            return Problem (ErrorResponseMessages.RemoveFromDatabaseErrorResponse (nameof (Tag)));

        return Ok();
    }

    [HttpGet ("types/{ID:guid}")]
    public async Task<ActionResult> FetchTagTypeAsync (Guid ID)
    {
        var tagTypeCollection = await _tagTypeRepository.QueryTagTypesAsync (tagType => tagType.PartitionKey == ID.ToString ());
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
        var tagGroupCollection = await _tagGroupRepository.QueryTagGroupsAsync (tagGroup => tagGroup.PartitionKey == ID.ToString ());
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
        var tagGroupTypeCollection = await _tagGroupTypeRepository.QueryTagGroupTypesAsync (tagGroupType => tagGroupType.PartitionKey == ID.ToString ());
        if (tagGroupTypeCollection.Count is 0)
            return NotFound (ErrorResponseMessages.NotFoundErrorResponse (nameof (TagGroupType)));
        if (tagGroupTypeCollection.Count is not 1)
            return Problem (ErrorResponseMessages.TooManyEntitiesErrorResponse (nameof (TagGroupType)));

        var tagGroupTypeToReturn = tagGroupTypeCollection.Single ();
        var tagTypeResponse = _tagMapper.MapTagGroupTypeToTagGroupTypeResponse (tagGroupTypeToReturn);
        return Ok (tagTypeResponse);
    }
}