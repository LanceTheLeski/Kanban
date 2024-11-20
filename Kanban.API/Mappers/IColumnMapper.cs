using Kanban.API.Models;
using Kanban.Contracts.Request.Create;
using Kanban.Contracts.Request.Patch;
using Kanban.Contracts.Response;

namespace Kanban.API.Mappers;

public interface IColumnMapper
{
    public Column MapColumnCreateRequestToColumn (ColumnCreateRequest columnCreateRequest);

    public Column MapColumnPatchRequestToColumn (ColumnPatchRequest columnPatchRequest);

    public ColumnResponse MapColumnToColumnResponse (Column column);
}