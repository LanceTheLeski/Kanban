using ArcStrides.API.Models.Board;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.API.Mappers;

[Mapper (AllowNullPropertyAssignment = false)]
public partial class ColumnMapper
{
    /// <summary>
    /// <see cref="ColumnCreateRequest"/> --> <see cref="Column"/>
    /// </summary>
    [MapProperty (nameof (ColumnCreateRequest.Title), nameof (Column.Title))]
    [MapProperty (nameof (ColumnCreateRequest.Order), nameof (Column.ColumnOrder))]
    public partial void MapColumnCreateRequestToColumn (ColumnCreateRequest columnCreateRequest, Column column);

    /// <summary>
    /// <see cref="ColumnPatchRequest"/> --> <see cref="Column"/>
    /// </summary>
    [MapProperty (nameof (ColumnPatchRequest.Title), nameof (Column.Title))]
    [MapProperty (nameof (ColumnPatchRequest.Order), nameof (Column.ColumnOrder))]
    public partial void MapColumnPatchRequestToColumn (ColumnPatchRequest columnPatchRequest, Column column);

    /// <summary>
    /// <see cref="Column"/> --> <see cref="ColumnPatchRequest"/>
    /// </summary>
    [MapProperty (nameof (Column.Title), nameof (ColumnPatchRequest.Title))]
    [MapProperty (nameof (Column.ColumnOrder), nameof (ColumnPatchRequest.Order))]
    public partial void MapColumnToColumnPatchRequest (Column column, ColumnPatchRequest columnPatchRequest);

    /// <summary>
    /// <see cref="Column"/> --> <see cref="ColumnResponse"/>
    /// </summary>
    [MapProperty (nameof (Column.PartitionKey), nameof (ColumnResponse.BoardID))]
    [MapProperty (nameof (Column.RowKey), nameof (ColumnResponse.ID))]
    [MapProperty (nameof (Column.Title), nameof (ColumnResponse.Title))]
    [MapProperty (nameof (Column.ColumnOrder), nameof (ColumnResponse.Order))]
    public partial void MapColumnToColumnResponse (Column column, ColumnResponse columnResponse);
}