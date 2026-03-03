using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Services;
using Microsoft.AspNetCore.JsonPatch;
using Newtonsoft.Json;

namespace ArcStrides.UI.Repositories;

public class TimelineRepository : ITimelineRepository
{
    private readonly IArcStridesService<TimelineResponse> _arcStridesTimelineBackend;

    public TimelineRepository (IArcStridesService<TimelineResponse> arcStridesTimelineBackend)
    {
        _arcStridesTimelineBackend = arcStridesTimelineBackend;
    }

    public async Task<TimelineResponse?> CreateTimelineAsync (Guid boardID, TimelineCreateRequest timelineCreateRequest)
        => await _arcStridesTimelineBackend.CreateEntityAsync ($"arcstrides/boards/{boardID}/timelines", JsonConvert.SerializeObject (timelineCreateRequest));

    public async Task<TimelineResponse?> UpdateTimelineAsync (Guid boardID, Guid timelineID, JsonPatchDocument timelinePatchRequestDocument)
        => await _arcStridesTimelineBackend.UpdateEntityAsync ($"arcstrides/boards/{boardID}/timelines/{timelineID}", JsonConvert.SerializeObject (timelinePatchRequestDocument));

    public async Task DeleteTimelineAsync (Guid boardID, Guid timelineID)
        => await _arcStridesTimelineBackend.DeleteEntityAsync ($"arcstrides/boards/{boardID}/timelines/{timelineID}");
}