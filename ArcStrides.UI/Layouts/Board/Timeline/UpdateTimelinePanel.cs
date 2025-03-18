namespace ArcStrides.UI.Layouts.Board.Timeline;

public partial class UpdateTimelinePanel
{
    private void TimelineFragmentChanged (bool isTimeline)
    {
        if (isTimeline)
        {
            _timelineFragment = _timelineRenderFragment ();
        }
        else
        {
            _timelineFragment = _deadlineRenderFragment ();
        }
    }

    private async System.Threading.Tasks.Task UpdateTimelineAsync ()
    {
        var timelinePatchRequest = new Contracts.Request.Patch.TimelinePatchRequest ();

        await _timelineRepository.UpdateTimelineAsync (BoardID.Value, Timeline.ID.Value, timelinePatchRequest);
    }
}