using ArcStrides.API.Models;
using ArcStrides.API.Models.TagGroup;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.API.Mappers;

[Mapper]
public partial class TagMapper : ITagMapper
{
    #region Tag

    [MapProperty (nameof (TagCreateRequest.ParentID), nameof (Tag.RowKey))]
    [MapProperty (nameof (TagCreateRequest.Title), nameof (Tag.Title))]
    [MapProperty (nameof (TagCreateRequest.TypeID), nameof (Tag.TagType))]
    public partial Tag MapTagCreateRequestToTag (TagCreateRequest tagCreateRequest);

    [MapProperty (nameof (TagPatchRequest.Title), nameof (Tag.Title))]
    [MapProperty (nameof (TagPatchRequest.TypeID), nameof (Tag.TagType))]
    public partial Tag MapTagPatchRequestToTag (TagPatchRequest tagPatchRequest);

    [MapProperty (nameof (Tag.Title), nameof (TagPatchRequest.Title))]
    [MapProperty (nameof (Tag.TagType), nameof (TagPatchRequest.TypeID))]
    public partial TagPatchRequest MapTagToTagPatchRequest (Tag tag);

    [MapProperty (nameof (Tag.PartitionKey), nameof (TagResponse.TagID))]
    [MapProperty (nameof (Tag.RowKey), nameof (TagResponse.ParentID))]
    [MapProperty (nameof (Tag.Title), nameof (TagResponse.Title))]
    public partial TagResponse MapTagToTagResponse (Tag tag);

    #endregion Tag

    #region TagType

    [MapProperty (nameof (TagType.PartitionKey), nameof (TagTypeResponse.ID))]
    [MapProperty (nameof (TagType.RowKey), nameof (TagTypeResponse.TagGroupID))]
    [MapProperty (nameof (TagType.Title), nameof (TagTypeResponse.Title))]
    public partial TagTypeResponse MapTagTypeToTagTypeResponse (TagType tagType);

    #endregion TagType

    #region TagGroup

    [MapProperty (nameof (TagGroup.PartitionKey), nameof (TagGroupResponse.ID))]
    [MapProperty (nameof (TagGroup.RowKey), nameof (TagGroupResponse.TagID))]
    [MapProperty (nameof (TagGroup.Title), nameof (TagGroupResponse.Title))]
    [MapProperty (nameof (TagGroup.TagGroupType), nameof (TagGroupResponse.TagGroupType))]
    public partial TagGroupResponse MapTagGroupToTagGroupResponse (TagGroup tagGroup);

    #endregion TagGroup

    #region TagGroupType

    [MapProperty (nameof (TagGroupType.PartitionKey), nameof (TagGroupTypeResponse.ID))]
    [MapProperty (nameof (TagGroupType.RowKey), nameof (TagGroupTypeResponse.TagGroupID))]
    [MapProperty (nameof (TagGroupType.Title), nameof (TagGroupTypeResponse.Title))]
    public partial TagGroupTypeResponse MapTagGroupTypeToTagGroupTypeResponse (TagGroupType tagGroupType); 

    #endregion TagGroupType
}