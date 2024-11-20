using Kanban.API.Models;
using Kanban.Contracts.Request.Create;
using Kanban.Contracts.Request.Patch;
using Kanban.Contracts.Response;
using Riok.Mapperly.Abstractions;

namespace Kanban.API.Mappers;

[Mapper]
public partial class ColumnMapper : IColumnMapper
{
    [MapProperty (nameof (ColumnCreateRequest.Title), nameof (Column.Title))]
    [MapProperty (nameof (ColumnCreateRequest.Order), nameof (Column.ColumnOrder))]
    [MapProperty (nameof (ColumnCreateRequest.BoardID), nameof (Column.RowKey))]
    public partial Column MapColumnCreateRequestToColumn (ColumnCreateRequest columnCreateRequest);

    [MapProperty (nameof (ColumnPatchRequest.Title), nameof (Column.Title))]
    [MapProperty (nameof (ColumnPatchRequest.Order), nameof (Column.ColumnOrder))]
    public partial Column MapColumnPatchRequestToColumn (ColumnPatchRequest columnPatchRequest);

    [MapProperty (nameof (Column.Title), nameof (ColumnPatchRequest.Title))]
    [MapProperty (nameof (Column.ColumnOrder), nameof (ColumnPatchRequest.Order))]
    public partial ColumnPatchRequest MapColumnToColumnPatchRequest (Column column);

    [MapProperty (nameof (Column.PartitionKey), nameof (ColumnResponse.ID))]
    [MapProperty (nameof (Column.RowKey), nameof (ColumnResponse.BoardID))]
    [MapProperty (nameof (Column.Title), nameof (ColumnResponse.Title))]
    [MapProperty (nameof (Column.ColumnOrder), nameof (ColumnResponse.Order))]
    public partial ColumnResponse MapColumnToColumnResponse (Column column);

}