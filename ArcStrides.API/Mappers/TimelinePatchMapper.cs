using ArcStrides.API.Models.Board;
using ArcStrides.Contracts.Request.Patch;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.API.Mappers;

/// <summary>
/// A patched <see cref="TimelinePatchRequest"/> --> the stored <see cref="Timeline"/>, nulls included.
/// </summary>
/// <remarks>
/// TimelineMapper skips nulls (AllowNullPropertyAssignment = false), so that copying a
/// converted row onto the stored one leaves its keys, its ETag and its parent alone.
/// That was also how a patch was written back, and it meant a point replaced with null
/// was never cleared: the PATCH answered 200 and the old date stayed, so a deadline
/// could not be taken off and a timeline could not be made timeless.
///
/// A patch request starts as the stored row's values (MapTimelineToTimelinePatchRequest)
/// with the patch applied over them, so every value in it is meant, null or not. Writing
/// all of them is right; the fields it does not carry — the keys, the parent — are not
/// touched, because there is nothing to map them from.
/// </remarks>
[Mapper]
public partial class TimelinePatchMapper
{
    public partial void ApplyTimelinePatchRequestToTimeline (TimelinePatchRequest timelinePatchRequest, Timeline timeline);
}
