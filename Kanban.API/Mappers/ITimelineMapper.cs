using Kanban.API.Models;
using Kanban.Contracts.Request.Create;
using Kanban.Contracts.Request.Patch;
using Kanban.Contracts.Response;

namespace Kanban.API.Mappers;

public interface ITimelineMapper
{
    Timeline MapTimelineCreateRequestToTimeline (TimelineCreateRequest timelineCreateRequest);

    Timeline MapTimelinePatchRequestToTimeline (TimelinePatchRequest timelineCreateRequest);

    TimelinePatchRequest MapTimelineToTimelinePatchRequest (Timeline timeline);
    
    TimelineResponse MapTimelineToTimelineResponse (Timeline timeline);
}