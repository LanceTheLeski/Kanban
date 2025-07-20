using ArcStrides.Contracts.Response;
using ArcStrides.UI.Models.Board;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.UI.Mappers;

[Mapper]
public partial class TimelineMapper
{
    /// <summary>
    /// <see cref="TimelineResponse"/> --> <see cref="Timeline"/>
    /// </summary>
    [MapProperty (nameof (TimelineResponse.ID), nameof (Timeline.ID))]
    [MapProperty (nameof (TimelineResponse.TimelineTypeID), nameof (Timeline.TimelineTypeID))]
    [MapProperty (nameof (TimelineResponse.StartDependencyTagGroupID), nameof (Timeline.StartDependencyTagGroupID))]
    [MapProperty (nameof (TimelineResponse.StartPreferenceUTC), nameof (Timeline.StartPreferenceUTC))]
    [MapProperty (nameof (TimelineResponse.StartDeadlineUTC), nameof (Timeline.StartDeadlineUTC))]
    [MapProperty (nameof (TimelineResponse.EndDependencyTagGroupID), nameof (Timeline.EndDependencyTagGroupID))]
    [MapProperty (nameof (TimelineResponse.EndPreferenceUTC), nameof (Timeline.EndPreferenceUTC))]
    [MapProperty (nameof (TimelineResponse.EndDeadlineUTC), nameof (Timeline.EndDeadlineUTC))]
    public partial Timeline MapTimelineResponseToTimeline (TimelineResponse cardResponse);
}