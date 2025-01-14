using ArcStrides.API.Models.Board;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;

namespace ArcStrides.API.Mappers;

public interface IColumnMapper
{
    Column MapColumnCreateRequestToColumn (ColumnCreateRequest columnCreateRequest);

    Column MapColumnPatchRequestToColumn (ColumnPatchRequest columnPatchRequest);

    ColumnPatchRequest MapColumnToColumnPatchRequest (Column column);

    ColumnResponse MapColumnToColumnResponse (Column column);
}