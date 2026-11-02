namespace ArcStrides.UI.Layouts.Board.Timeline;

public partial class UpdateTimelinePanel
{
    private void TimelineFragmentChanged (bool? isTimeline)
    {
        if (isTimeline is true)
        {
            _timelineFragment = _timelineRenderFragment ();
        }
        else if (isTimeline is false)
        {
            _timelineFragment = _deadlineRenderFragment ();
        }
        else
        {
            _timelineFragment = _timelessRenderFragment ();
        }
    }

    private async System.Threading.Tasks.Task CreateTimelineAsync ()
    {

    }

    private async System.Threading.Tasks.Task UpdateTimelineAsync ()
    {
        var timelinePatchRequest = new Contracts.Request.Patch.TimelinePatchRequest ();

        //await _timelineRepository.UpdateTimelineAsync (BoardID.Value, Timeline.ID.Value, timelinePatchRequest);
    }
}