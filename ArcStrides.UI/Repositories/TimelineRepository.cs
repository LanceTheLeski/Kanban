using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Services;
using Newtonsoft.Json;

namespace ArcStrides.UI.Repositories;

public class TimelineRepository : ITimelineRepository
{
    private readonly IArcStridesService<TimelineResponse> _arcStridesTimelineBackend;

    public TimelineRepository (IArcStridesService<TimelineResponse> arcStridesTimelineBackend)
    {
        _arcStridesTimelineBackend = arcStridesTimelineBackend;
    }

    public async Task<TimelineResponse?> UpdateTimelineAsync (Guid boardID, Guid timelineID, TimelinePatchRequest timelinePatchRequest)
        => await _arcStridesTimelineBackend.UpdateEntityAsync ($"arcstrides/boards/{boardID}/timelines/{timelineID}", JsonConvert.SerializeObject (timelinePatchRequest));

}