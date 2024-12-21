using ArcStrides.API.Models;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;

namespace ArcStrides.API.Mappers;

public interface ITimelineMapper
{
    Timeline MapTimelineCreateRequestToTimeline (TimelineCreateRequest timelineCreateRequest);

    Timeline MapTimelinePatchRequestToTimeline (TimelinePatchRequest timelineCreateRequest);

    TimelinePatchRequest MapTimelineToTimelinePatchRequest (Timeline timeline);
    
    TimelineResponse MapTimelineToTimelineResponse (Timeline timeline);
}