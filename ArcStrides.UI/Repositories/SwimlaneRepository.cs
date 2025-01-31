using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Services;
using Newtonsoft.Json;

namespace ArcStrides.UI.Repositories;

public class SwimlaneRepository : ISwimlaneRepository
{
    private readonly IArcStridesService<SwimlaneResponse> _arcStridesBackend;

    public SwimlaneRepository (IArcStridesService<SwimlaneResponse> arcStridesBackend)
    {
        _arcStridesBackend = arcStridesBackend;
    }

    public async Task<SwimlaneResponse?> CreateSwimlaneAsync (Guid boardID, SwimlaneCreateRequest swimlaneCreateRequest)
        => await _arcStridesBackend.CreateEntityAsync (@$"arcstrides/boards/{boardID}/swimlanes", JsonConvert.SerializeObject (swimlaneCreateRequest));

    public async Task<SwimlaneResponse?> UpdateSwimlaneAsync (Guid boardID, Guid swimlaneID, string swimlanePatchRequest)
        => await _arcStridesBackend.UpdateEntityAsync (@$"arcstrides/boards/{boardID}/swimlanes/{swimlaneID}", swimlanePatchRequest);

    public async Task DeleteSwimlaneAsync (Guid boardID, Guid swimlaneID)
        => await _arcStridesBackend.DeleteEntityAsync (@$"arcstrides/boards/{boardID}/swimlanes/{swimlaneID}");
}