using ArcStrides.API.Models.Board;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.API.Mappers;

[Mapper]
public partial class TimelineMapper : ITimelineMapper
{
    /// <summary>
    /// <see cref="TimelineCreateRequest"/> --> <see cref="Timeline"/>
    /// </summary>
    [MapProperty (nameof (TimelineCreateRequest.ParentID), nameof (Timeline.ParentObjectID))]
    [MapProperty (nameof (TimelineCreateRequest.TimelineTypeID), nameof (Timeline.TimelineTypeID))]
    [MapProperty (nameof (TimelineCreateRequest.StartDependencyTagGroupID), nameof (Timeline.StartDependencyTagGroupID))]
    [MapProperty (nameof (TimelineCreateRequest.StartPreferenceUTC), nameof (Timeline.StartPreferenceUTC))]
    [MapProperty (nameof (TimelineCreateRequest.StartDeadlineUTC), nameof (Timeline.StartDeadlineUTC))]
    [MapProperty (nameof (TimelineCreateRequest.EndDependencyTagGroupID), nameof (Timeline.EndDependencyTagGroupID))]
    [MapProperty (nameof (TimelineCreateRequest.EndPreferenceUTC), nameof (Timeline.EndPreferenceUTC))]
    [MapProperty (nameof (TimelineCreateRequest.EndDeadlineUTC), nameof (Timeline.EndDeadlineUTC))]
    public partial Timeline MapTimelineCreateRequestToTimeline (TimelineCreateRequest timelineCreateRequest);

    /// <summary>
    /// <see cref="TimelinePatchRequest"/> --> <see cref="Timeline"/>
    /// </summary>
    [MapProperty (nameof (TimelinePatchRequest.TimelineTypeID), nameof (Timeline.TimelineTypeID))]
    [MapProperty (nameof (TimelinePatchRequest.StartDependencyTagGroupID), nameof (Timeline.StartDependencyTagGroupID))]
    [MapProperty (nameof (TimelinePatchRequest.StartPreferenceUTC), nameof (Timeline.StartPreferenceUTC))]
    [MapProperty (nameof (TimelinePatchRequest.StartDeadlineUTC), nameof (Timeline.StartDeadlineUTC))]
    [MapProperty (nameof (TimelinePatchRequest.EndDependencyTagGroupID), nameof (Timeline.EndDependencyTagGroupID))]
    [MapProperty (nameof (TimelinePatchRequest.EndPreferenceUTC), nameof (Timeline.EndPreferenceUTC))]
    [MapProperty (nameof (TimelinePatchRequest.EndDeadlineUTC), nameof (Timeline.EndDeadlineUTC))]
    public partial Timeline MapTimelinePatchRequestToTimeline (TimelinePatchRequest timelineCreateRequest);

    /// <summary>
    /// <see cref="Timeline"/> --> <see cref="TimelinePatchRequest"/>
    /// </summary>
    [MapProperty (nameof (Timeline.TimelineTypeID), nameof (TimelinePatchRequest.TimelineTypeID))]
    [MapProperty (nameof (Timeline.StartDependencyTagGroupID), nameof (TimelinePatchRequest.StartDependencyTagGroupID))]
    [MapProperty (nameof (Timeline.StartPreferenceUTC), nameof (TimelinePatchRequest.StartPreferenceUTC))]
    [MapProperty (nameof (Timeline.StartDeadlineUTC), nameof (TimelinePatchRequest.StartDeadlineUTC))]
    [MapProperty (nameof (Timeline.EndDependencyTagGroupID), nameof (TimelinePatchRequest.EndDependencyTagGroupID))]
    [MapProperty (nameof (Timeline.EndPreferenceUTC), nameof (TimelinePatchRequest.EndPreferenceUTC))]
    [MapProperty (nameof (Timeline.EndDeadlineUTC), nameof (TimelinePatchRequest.EndDeadlineUTC))]
    public partial TimelinePatchRequest MapTimelineToTimelinePatchRequest (Timeline timeline);

    /// <summary>
    /// <see cref="Timeline"/> --> <see cref="TimelineResponse"/>
    /// </summary>
    [MapProperty (nameof (Timeline.RowKey), nameof (TimelineResponse.ID))]
    [MapProperty (nameof (Timeline.TimelineTypeID), nameof (TimelineResponse.TimelineTypeID))]
    [MapProperty (nameof (Timeline.StartDependencyTagGroupID), nameof (TimelineResponse.StartDependencyTagGroupID))]
    [MapProperty (nameof (Timeline.StartPreferenceUTC), nameof (TimelineResponse.StartPreferenceUTC))]
    [MapProperty (nameof (Timeline.StartDeadlineUTC), nameof (TimelineResponse.StartDeadlineUTC))]
    [MapProperty (nameof (Timeline.EndDependencyTagGroupID), nameof (TimelineResponse.EndDependencyTagGroupID))]
    [MapProperty (nameof (Timeline.EndPreferenceUTC), nameof (TimelineResponse.EndPreferenceUTC))]
    [MapProperty (nameof (Timeline.EndDeadlineUTC), nameof (TimelineResponse.EndDeadlineUTC))]
    public partial TimelineResponse MapTimelineToTimelineResponse (Timeline timeline);
}