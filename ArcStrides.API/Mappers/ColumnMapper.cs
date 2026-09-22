using ArcStrides.API.Models.Board;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.API.Mappers;

[Mapper (AllowNullPropertyAssignment = false)]
public partial class ColumnMapper
{
    public partial void MapFieldsFromSourceToTarget (Column source, Column target);

    /// <summary>
    /// <see cref="ColumnCreateRequest"/> --> <see cref="Column"/>
    /// </summary>
    [MapProperty (nameof (ColumnCreateRequest.Title), nameof (Column.Title))]
    [MapProperty (nameof (ColumnCreateRequest.Order), nameof (Column.ColumnOrder))]
    [MapProperty (nameof (ColumnCreateRequest.Color), nameof (Column.ColumnColor))]
    [MapProperty (nameof (ColumnCreateRequest.GlobalColor), nameof (Column.GlobalColumnColor))]
    public partial Column MapColumnCreateRequestToColumn (ColumnCreateRequest columnCreateRequest);

    /// <summary>
    /// <see cref="ColumnPatchRequest"/> --> <see cref="Column"/>
    /// </summary>
    [MapProperty (nameof (ColumnPatchRequest.Title), nameof (Column.Title))]
    [MapProperty (nameof (ColumnPatchRequest.Order), nameof (Column.ColumnOrder))]
    [MapProperty (nameof (ColumnPatchRequest.Color), nameof (Column.ColumnColor))]
    [MapProperty (nameof (ColumnPatchRequest.GlobalColor), nameof (Column.GlobalColumnColor))]
    public partial Column MapColumnPatchRequestToColumn (ColumnPatchRequest columnPatchRequest);

    /// <summary>
    /// <see cref="Column"/> --> <see cref="ColumnPatchRequest"/>
    /// </summary>
    [MapProperty (nameof (Column.Title), nameof (ColumnPatchRequest.Title))]
    [MapProperty (nameof (Column.ColumnOrder), nameof (ColumnPatchRequest.Order))]
    [MapProperty (nameof (Column.ColumnColor), nameof (ColumnPatchRequest.Color))]
    [MapProperty (nameof (Column.GlobalColumnColor), nameof (ColumnPatchRequest.GlobalColor))]
    public partial ColumnPatchRequest MapColumnToColumnPatchRequest (Column column);

    /// <summary>
    /// <see cref="Column"/> --> <see cref="ColumnResponse"/>
    /// </summary>
    [MapProperty (nameof (Column.PartitionKey), nameof (ColumnResponse.BoardID))]
    [MapProperty (nameof (Column.RowKey), nameof (ColumnResponse.ID))]
    [MapProperty (nameof (Column.Title), nameof (ColumnResponse.Title))]
    [MapProperty (nameof (Column.ColumnOrder), nameof (ColumnResponse.Order))]
    [MapProperty (nameof (Column.ColumnColor), nameof (ColumnResponse.Color))]
    [MapProperty (nameof (Column.GlobalColumnColor), nameof (ColumnResponse.GlobalColor))]
    public partial ColumnResponse MapColumnToColumnResponse (Column column);
}