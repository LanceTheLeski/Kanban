using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using Microsoft.AspNetCore.JsonPatch;

namespace ArcStrides.UI.Repositories;

public interface ITimelineRepository
{
    Task<TimelineResponse?> CreateTimelineAsync (Guid boardID, TimelineCreateRequest timelineCreateRequest);

    Task<TimelineResponse?> UpdateTimelineAsync (Guid boardID, Guid timelineID, JsonPatchDocument timelinePatchRequestDocument);

    Task DeleteTimelineAsync (Guid boardID, Guid timelineID);
}