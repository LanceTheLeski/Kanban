using ArcStrides.API.Models;
using ArcStrides.API.Models.TagGroup;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;

namespace ArcStrides.API.Mappers;

public interface ITagMapper
{
    #region Tag

    Tag MapTagCreateRequestToTag (TagCreateRequest tagCreateRequest);

    Tag MapTagPatchRequestToTag (TagPatchRequest tagPatchRequest);

    TagPatchRequest MapTagToTagPatchRequest (Tag tag);

    TagResponse MapTagToTagResponse (Tag tag);

    #endregion Tag

    #region TagType

    TagTypeResponse MapTagTypeToTagTypeResponse (TagType tagType);

    #endregion TagType

    #region TagGroup

    TagGroupResponse MapTagGroupToTagGroupResponse (TagGroup tagGroup);

    #endregion TagGroup

    #region TagGroupType

    TagGroupTypeResponse MapTagGroupTypeToTagGroupTypeResponse (TagGroupType tagGroupType);

    #endregion TagGroupType
}