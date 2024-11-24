using Kanban.API.Models;
using Kanban.Contracts.Request.Create;
using Kanban.Contracts.Request.Patch;
using Kanban.Contracts.Response;

namespace Kanban.API.Mappers;

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
}