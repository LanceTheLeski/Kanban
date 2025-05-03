using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Layouts.Board.Timeline;
using Microsoft.AspNetCore.JsonPatch;

namespace ArcStrides.UI.Layouts.Board.Task;

public partial class UpdateTaskOverlay
{
    private void SetTaskTypeOnTask (string taskTypeName)
    {
        var matchingTaskTypes = _taskTypes.FindAll (taskType => taskType.Title == taskTypeName);
        if (matchingTaskTypes.Count () is not 1)
        {
            // Should we throw exceptions? Or have the snackbar display exceptions?
            // I think that the UI should throw exceptions and the Blazor UI should maybe use something reliable like the snackbar.
            throw new Exception ($"The task type selected does not correspond to a single column in our list of columns. Number of this task type found: {matchingTaskTypes}");
        }

        _taskTypeIdToAssign = matchingTaskTypes.Single ().ID!.Value;
    }

    private void SetTaskOrderOnTask (string taskOrder)
        => ActiveTask!.Order = int.Parse (taskOrder) - 1;

    private async Task<List<TaskTypeResponse>> FetchTaskTypesAsync ()
        => await _taskRepository.FetchTaskTypesAsync (new List<int> { 0 });

    private async System.Threading.Tasks.Task UpdateTaskAsync ()
    {
        var patchDocument = new JsonPatchDocument ();

        if (ActiveTask!.Title != _initialTaskTitle)
            patchDocument.Add (nameof (TaskPatchRequest.Title), ActiveTask.Title);

        if (ActiveTask.TaskType?.ID != _taskTypeIdToAssign)
            patchDocument.Add (nameof (TaskPatchRequest.TypeID), _taskTypeIdToAssign);

        if (ActiveTask.Order != _initialTaskOrder)
            patchDocument.Add (nameof (TaskPatchRequest.Order), ActiveTask.Order);

        await UpdateTimelineAsync (ActiveTask.Timeline);

        if (ActiveTask.IsCompleted != _initialIsCompleted)
            patchDocument.Add (nameof (TaskPatchRequest.IsComplete), ActiveTask.IsCompleted);

        await _taskRepository.UpdateTaskAsync (BoardID, CardID.Value, ActiveTask.ID!.Value, patchDocument);

        Refresh.InvokeAsync (true);
    }

    private async System.Threading.Tasks.Task UpdateTimelineAsync (Models.Board.Timeline? timelineToUpdate)
    {
        var patchDocument = new JsonPatchDocument ();

        if (ActiveTask!.Timeline?.StartDependencyTagGroupID != _initialTimeline?.StartDependencyTagGroupID)
        {
            patchDocument.Add (nameof (TimelinePatchRequest.StartDependencyTagGroupID), _initialTimeline?.StartDependencyTagGroupID);
        }

        if (ActiveTask!.Timeline?.StartPreferenceUTC != updateTimelinePanel._dateRangePreferred.Start)
        {
            patchDocument.Add (nameof (TimelinePatchRequest.StartPreferenceUTC), updateTimelinePanel._dateRangePreferred.Start);
        }
        if (ActiveTask!.Timeline?.StartPreferenceUTC?.TimeOfDay != updateTimelinePanel._timePreferredStart)
        {
            var dayWithUpdatedTime = new DateTime ((long) ActiveTask!.Timeline?.StartDeadlineUTC.Value.Date.Ticks + updateTimelinePanel._timePreferredStart.Value.Ticks);
            patchDocument.Add (nameof (TimelinePatchRequest.StartPreferenceUTC), dayWithUpdatedTime);
        }

        if (ActiveTask!.Timeline?.StartDeadlineUTC != updateTimelinePanel._dateRangeRequired.Start)
        {
            patchDocument.Add (nameof (TimelinePatchRequest.StartDeadlineUTC), updateTimelinePanel._dateRangeRequired.Start);
        }
        if (ActiveTask!.Timeline?.StartDeadlineUTC?.TimeOfDay != updateTimelinePanel._timeRequiredStart)
        {
            var dayWithUpdatedTime = new DateTime ((long) ActiveTask!.Timeline?.StartDeadlineUTC.Value.Date.Ticks + updateTimelinePanel._timeRequiredStart.Value.Ticks);
            patchDocument.Add (nameof (TimelinePatchRequest.StartDeadlineUTC), dayWithUpdatedTime);
        }

        if (ActiveTask!.Timeline?.EndDependencyTagGroupID != _initialTimeline?.EndDependencyTagGroupID)
        {
            patchDocument.Add (nameof (TimelinePatchRequest.EndDependencyTagGroupID), _initialTimeline?.EndDependencyTagGroupID);
        }

        if (ActiveTask!.Timeline?.EndPreferenceUTC != updateTimelinePanel._dateRangePreferred.End)
        {
            patchDocument.Add (nameof (TimelinePatchRequest.EndPreferenceUTC), updateTimelinePanel._dateRangePreferred.End);
        }
        if (ActiveTask!.Timeline?.EndPreferenceUTC?.TimeOfDay != updateTimelinePanel._timePreferredEnd)
        {
            var dayWithUpdatedTime = new DateTime ((long) ActiveTask!.Timeline?.EndPreferenceUTC.Value.Date.Ticks + updateTimelinePanel._timePreferredEnd.Value.Ticks);
            patchDocument.Add (nameof (TimelinePatchRequest.EndPreferenceUTC), dayWithUpdatedTime);
        }

        if (ActiveTask!.Timeline?.EndDeadlineUTC != updateTimelinePanel._dateRangeRequired.End)
        {
            patchDocument.Add (nameof (TimelinePatchRequest.EndDeadlineUTC), updateTimelinePanel._dateRangeRequired.End);
        }
        if (ActiveTask!.Timeline?.EndDeadlineUTC?.TimeOfDay != updateTimelinePanel._timeRequiredEnd)
        {
            var dayWithUpdatedTime = new DateTime ((long) ActiveTask!.Timeline?.EndDeadlineUTC.Value.Date.Ticks + updateTimelinePanel._timeRequiredEnd.Value.Ticks);
            patchDocument.Add (nameof (TimelinePatchRequest.EndDeadlineUTC), dayWithUpdatedTime);
        }

        if (patchDocument.Operations.Count is not 0)
            await _timelineRepository.UpdateTimelineAsync (BoardID, timelineToUpdate!.ID!.Value, patchDocument);
    }
}