using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;

namespace ArcStrides.UI.Repositories;

public interface ITimelineRepository
{
    Task<TimelineResponse?> CreateTimelineAsync (Guid boardID, TimelineCreateRequest timelineCreateRequest);

    Task<TimelineResponse?> UpdateTimelineAsync (Guid boardID, Guid timelineID, TimelinePatchRequest timelinePatchRequest);
}