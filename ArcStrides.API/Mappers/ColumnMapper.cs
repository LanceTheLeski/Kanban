using ArcStrides.API.Models.Board;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.API.Mappers;

[Mapper]
public partial class ColumnMapper : IColumnMapper
{
    /// <summary>
    /// <see cref="ColumnCreateRequest"/> --> <see cref="Column"/>
    /// </summary>
    [MapProperty (nameof (ColumnCreateRequest.Title), nameof (Column.Title))]
    [MapProperty (nameof (ColumnCreateRequest.Order), nameof (Column.ColumnOrder))]
    public partial Column MapColumnCreateRequestToColumn (ColumnCreateRequest columnCreateRequest);

    /// <summary>
    /// <see cref="ColumnPatchRequest"/> --> <see cref="Column"/>
    /// </summary>
    [MapProperty (nameof (ColumnPatchRequest.Title), nameof (Column.Title))]
    [MapProperty (nameof (ColumnPatchRequest.Order), nameof (Column.ColumnOrder))]
    public partial Column MapColumnPatchRequestToColumn (ColumnPatchRequest columnPatchRequest);

    /// <summary>
    /// <see cref="Column"/> --> <see cref="ColumnPatchRequest"/>
    /// </summary>
    [MapProperty (nameof (Column.Title), nameof (ColumnPatchRequest.Title))]
    [MapProperty (nameof (Column.ColumnOrder), nameof (ColumnPatchRequest.Order))]
    public partial ColumnPatchRequest MapColumnToColumnPatchRequest (Column column);

    /// <summary>
    /// <see cref="Column"/> --> <see cref="ColumnResponse"/>
    /// </summary>
    [MapProperty (nameof (Column.PartitionKey), nameof (ColumnResponse.ID))]
    [MapProperty (nameof (Column.RowKey), nameof (ColumnResponse.BoardID))]
    [MapProperty (nameof (Column.Title), nameof (ColumnResponse.Title))]
    [MapProperty (nameof (Column.ColumnOrder), nameof (ColumnResponse.Order))]
    public partial ColumnResponse MapColumnToColumnResponse (Column column);
}