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

    /// <summary>
    /// <see cref="TagCreateRequest"/> --> <see cref="Tag"/>
    /// </summary>
    [MapProperty (nameof (TagCreateRequest.ParentID), nameof (Tag.RowKey))]
    [MapProperty (nameof (TagCreateRequest.Title), nameof (Tag.Title))]
    [MapProperty (nameof (TagCreateRequest.TypeID), nameof (Tag.TagTypeID))]
    public partial Tag MapTagCreateRequestToTag (TagCreateRequest tagCreateRequest);

    /// <summary>
    /// <see cref="TagPatchRequest"/> --> <see cref="Tag"/>
    /// </summary>
    [MapProperty (nameof (TagPatchRequest.Title), nameof (Tag.Title))]
    [MapProperty (nameof (TagPatchRequest.TypeID), nameof (Tag.TagTypeID))]
    public partial Tag MapTagPatchRequestToTag (TagPatchRequest tagPatchRequest);

    /// <summary>
    /// <see cref="Tag"/> --> <see cref="TagPatchRequest"/>
    /// </summary>
    [MapProperty (nameof (Tag.Title), nameof (TagPatchRequest.Title))]
    [MapProperty (nameof (Tag.TagTypeID), nameof (TagPatchRequest.TypeID))]
    public partial TagPatchRequest MapTagToTagPatchRequest (Tag tag);

    /// <summary>
    /// <see cref="Tag"/> --> <see cref="TagResponse"/>
    /// </summary>
    [MapProperty (nameof (Tag.TagID), nameof (TagResponse.ID))]
    [MapProperty (nameof (Tag.RowKey), nameof (TagResponse.ParentID))]
    [MapProperty (nameof (Tag.ParentObjectTypeName), nameof (TagResponse.ParentTypeName))]
    [MapProperty (nameof (Tag.Title), nameof (TagResponse.Title))]
    public partial TagResponse MapTagToTagResponse (Tag tag);

    #endregion Tag

    #region TagType

    /// <summary>
    /// <see cref="TagType"/> --> <see cref="TagTypeResponse"/>
    /// </summary>
    [MapProperty (nameof (TagType.PartitionKey), nameof (TagTypeResponse.TagGroupID))]
    [MapProperty (nameof (TagType.RowKey), nameof (TagTypeResponse.ID))]
    [MapProperty (nameof (TagType.Title), nameof (TagTypeResponse.Title))]
    public partial TagTypeResponse MapTagTypeToTagTypeResponse (TagType tagType);

    #endregion TagType

    #region TagGroup

    /// <summary>
    /// <see cref="TagGroup"/> --> <see cref="TagGroupResponse"/>
    /// </summary>
    [MapProperty (nameof (TagGroup.PartitionKey), nameof (TagGroupResponse.ID))]
    [MapProperty (nameof (TagGroup.RowKey), nameof (TagGroupResponse.TagID))]
    [MapProperty (nameof (TagGroup.Title), nameof (TagGroupResponse.Title))]
    [MapProperty (nameof (TagGroup.TagGroupTypeID), nameof (TagGroupResponse.TagGroupTypeID))]
    public partial TagGroupResponse MapTagGroupToTagGroupResponse (TagGroup tagGroup);

    #endregion TagGroup

    #region TagGroupType

    /// <summary>
    /// <see cref="TagGroupType"/> --> <see cref="TagGroupTypeResponse"/>
    /// </summary>
    [MapProperty (nameof (TagGroupType.PartitionKey), nameof (TagGroupTypeResponse.TagGroupID))]
    [MapProperty (nameof (TagGroupType.RowKey), nameof (TagGroupTypeResponse.ID))]
    [MapProperty (nameof (TagGroupType.Title), nameof (TagGroupTypeResponse.Title))]
    public partial TagGroupTypeResponse MapTagGroupTypeToTagGroupTypeResponse (TagGroupType tagGroupType); 

    #endregion TagGroupType
}