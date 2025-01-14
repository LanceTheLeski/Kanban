using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;

namespace ArcStrides.UI.Repositories;

public interface IColumnRepository
{
    Task<ColumnResponse?> CreateColumnAsync (Guid boardID, ColumnCreateRequest columnCreateRequest);

}