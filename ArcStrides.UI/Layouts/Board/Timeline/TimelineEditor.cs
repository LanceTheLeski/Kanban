namespace ArcStrides.UI.Layouts.Board.Timeline;

public partial class TimelineEditor
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
}
