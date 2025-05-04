using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Layouts.Board.Timeline;
using Microsoft.AspNetCore.JsonPatch;
using System.Xml.XPath;

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

        _initialTaskTypeId = matchingTaskTypes.Single ().ID!.Value;
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

        if (ActiveTask.TaskType?.ID != _initialTaskTypeId)
            patchDocument.Add (nameof (TaskPatchRequest.TypeID), _initialTaskTypeId);

        if (ActiveTask.Order != _initialTaskOrder)
            patchDocument.Add (nameof (TaskPatchRequest.Order), ActiveTask.Order);

        if (updateTimelinePanel.isTimeless is false && ActiveTask.Timeline?.ID is null)
        {
            var newTimelineID = await CreateTimelineAsync ();
            if (newTimelineID is not null)
                patchDocument.Add (nameof (TaskPatchRequest.TimelineID), newTimelineID);
        }
        else // Might want a condidition for isTimeless is true BUT the timeline ID is populated - e.g. We switch from having a timeline to not having one..
        { 
            await UpdateTimelineAsync (); 
        }

        if (ActiveTask.IsCompleted != _initialIsCompleted)
            patchDocument.Add (nameof (TaskPatchRequest.IsComplete), ActiveTask.IsCompleted);

        await _taskRepository.UpdateTaskAsync (BoardID, CardID.Value, ActiveTask.ID!.Value, patchDocument);

        Refresh.InvokeAsync (true);
    }

    private async System.Threading.Tasks.Task<Guid?> CreateTimelineAsync ()
    {
        var startPreferenceUTC = updateTimelinePanel._dateRangePreferred.Start.HasValue
                                 || updateTimelinePanel._timePreferredStart.HasValue
                                    ? new DateTime ((updateTimelinePanel._dateRangePreferred.Start?.Date.Ticks ?? DateTime.Now.Date.Ticks) + (updateTimelinePanel._timePreferredStart?.Ticks ?? 0))
                                    : null as DateTime?;
        var startDeadlineUTC = updateTimelinePanel._dateRangeRequired.Start.HasValue
                                 || updateTimelinePanel._timeRequiredStart.HasValue
                                    ? new DateTime ((updateTimelinePanel._dateRangeRequired.Start?.Date.Ticks ?? DateTime.Now.Date.Ticks) + (updateTimelinePanel._timeRequiredStart?.Ticks ?? 0))
                                    : null as DateTime?;
        var endPreferenceUTC = updateTimelinePanel._dateRangePreferred.End.HasValue
                               || updateTimelinePanel._timePreferredEnd.HasValue
                                    ? new DateTime ((updateTimelinePanel._dateRangePreferred.End?.Date.Ticks ?? DateTime.Now.Date.Ticks) + (updateTimelinePanel._timePreferredEnd?.Ticks ?? 0))
                                    : null as DateTime?;
        var endDeadlineUTC = updateTimelinePanel._dateRangeRequired.End.HasValue
                             || updateTimelinePanel._timeRequiredEnd.HasValue
                                    ? new DateTime ((updateTimelinePanel._dateRangeRequired.End?.Date.Ticks ?? DateTime.Now.Date.Ticks) + (updateTimelinePanel._timeRequiredEnd?.Ticks ?? 0))
                                    : null as DateTime?;
        
        var timelineCreateRequest = new TimelineCreateRequest
        {
            ParentID = ActiveTask.ID,
            TimelineTypeID = 2, //Temp value for now..
            StartDependencyTagGroupID = null, // Change very soon..
            StartPreferenceUTC = startPreferenceUTC,
            StartDeadlineUTC = startDeadlineUTC,
            EndDependencyTagGroupID = null, // Change very soon..
            EndPreferenceUTC = endPreferenceUTC,
            EndDeadlineUTC = endDeadlineUTC
        };

        var timelineResponse = await _timelineRepository.CreateTimelineAsync(BoardID, timelineCreateRequest);
        return timelineResponse!.ID;
    }

    private async System.Threading.Tasks.Task UpdateTimelineAsync ()
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
            var dayWithUpdatedTime = new DateTime ((long) ActiveTask!.Timeline?.StartPreferenceUTC.Value.Date.Ticks + updateTimelinePanel._timePreferredStart.Value.Ticks);
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
        {
            await _timelineRepository.UpdateTimelineAsync (BoardID, ActiveTask!.Timeline!.ID!.Value, patchDocument); 
        }
    }
}