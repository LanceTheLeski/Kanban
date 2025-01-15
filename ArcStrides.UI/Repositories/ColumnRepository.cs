using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Services;
using Newtonsoft.Json;

namespace ArcStrides.UI.Repositories;

public class ColumnRepository : IColumnRepository
{
    private readonly IArcStridesService<ColumnResponse> _arcStridesBackend;

    public ColumnRepository (IArcStridesService<ColumnResponse> arcStridesBackend)
    {
        _arcStridesBackend = arcStridesBackend;
    }

    public async Task<ColumnResponse?> CreateColumnAsync (Guid boardID, ColumnCreateRequest columnCreateRequest)
        => await _arcStridesBackend.CreateEntityAsync ($@"arcstrides/boards/{boardID}/columns", JsonConvert.SerializeObject (columnCreateRequest));
    
    public async Task<ColumnResponse?> UpdateColumnAsync (Guid boardID, Guid columnID, string columnPatchRequest)
        => await _arcStridesBackend.UpdateEntityAsync ($@"arcstrides/boards/{boardID}/columns/{columnID}", JsonConvert.SerializeObject (columnPatchRequest));

    public async Task DeleteColumnAsync (Guid boardID, Guid columnID)
        => await _arcStridesBackend.DeleteEntityAsync ($@"arcstrides/boards/{boardID}/columns/{columnID}");
}