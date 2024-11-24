using Kanban.API.Models;
using Kanban.Contracts.Request.Create;
using Kanban.Contracts.Request.Patch;
using Riok.Mapperly.Abstractions;

namespace Kanban.API.Mappers;

[Mapper]
public partial class TimelineMapper : ITimelineMapper
{
    [MapProperty (nameof (TimelineCreateRequest.ParentID), nameof (Timeline.RowKey))]
    [MapProperty (nameof (TimelineCreateRequest.EndDependencyTagGroupID), nameof (Timeline.StartDependencyTagGroupID))]
    [MapProperty (nameof (TimelineCreateRequest.StartPreferenceUTC), nameof (Timeline.StartPreferenceUTC))]
    [MapProperty (nameof (TimelineCreateRequest.StartDeadlineUTC), nameof (Timeline.StartDeadlineUTC))]
    [MapProperty (nameof (TimelineCreateRequest.EndDependencyTagGroupID), nameof (Timeline.EndDependencyTagGroupID))]
    [MapProperty (nameof (TimelineCreateRequest.EndPreferenceUTC), nameof (Timeline.EndPreferenceUTC))]
    [MapProperty (nameof (TimelineCreateRequest.EndDeadlineUTC), nameof (Timeline.EndDeadlineUTC))]
    public partial Timeline MapTimelineCreateRequestToTimeline (TimelineCreateRequest timelineCreateRequest);

    [MapProperty (nameof (TimelinePatchRequest.EndDependencyTagGroupID), nameof (Timeline.StartDependencyTagGroupID))]
    [MapProperty (nameof (TimelinePatchRequest.StartPreferenceUTC), nameof (Timeline.StartPreferenceUTC))]
    [MapProperty (nameof (TimelinePatchRequest.StartDeadlineUTC), nameof (Timeline.StartDeadlineUTC))]
    [MapProperty (nameof (TimelinePatchRequest.EndDependencyTagGroupID), nameof (Timeline.EndDependencyTagGroupID))]
    [MapProperty (nameof (TimelinePatchRequest.EndPreferenceUTC), nameof (Timeline.EndPreferenceUTC))]
    [MapProperty (nameof (TimelinePatchRequest.EndDeadlineUTC), nameof (Timeline.EndDeadlineUTC))]
    public partial Timeline MapTimelinePatchRequestToTimeline (TimelinePatchRequest timelineCreateRequest);

    [MapProperty (nameof (Timeline.StartDependencyTagGroupID), nameof (TimelinePatchRequest.EndDependencyTagGroupID))]
    [MapProperty (nameof (Timeline.StartPreferenceUTC), nameof (TimelinePatchRequest.StartPreferenceUTC))]
    [MapProperty (nameof (Timeline.StartDeadlineUTC), nameof (TimelinePatchRequest.StartDeadlineUTC))]
    [MapProperty (nameof (Timeline.EndDependencyTagGroupID), nameof (TimelinePatchRequest.EndDependencyTagGroupID))]
    [MapProperty (nameof (Timeline.EndPreferenceUTC), nameof (TimelinePatchRequest.EndPreferenceUTC))]
    [MapProperty (nameof (Timeline.EndDeadlineUTC), nameof (TimelinePatchRequest.EndDeadlineUTC))]
    public partial TimelinePatchRequest MapTimelineToTimelimePatchRequest (Timeline timeline);
}