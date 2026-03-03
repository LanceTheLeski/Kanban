using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Components.ArcOverlay;

namespace ArcStrides.UI.Layouts.TagGroup.TaskType;

public partial class CreateTaskTypeOverlay : IArcOverlay
{
    private TagGroupResponse tagGroupToAssign = default;

    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }

    public async Task<List<TagGroupResponse>> FetchTagGroupsAsync ()
        => await _tagRepository.FetchTagGroupsAsync ();

    public void SetTagGroupOnTaskType (string tagGroupTitle)
    {
        var matchingTagGroups = _tagGroups.FindAll (tagGroup => tagGroup.Title == tagGroupTitle);
        if (matchingTagGroups.Count () is not 1)
        {
            // Should we throw exceptions? Or have the snackbar display exceptions?
            // I think that the UI should throw exceptions and the Blazor UI should maybe use something reliable like the snackbar.
            throw new Exception ($"The tag group selected does not correspond to a single column in our list of columns. Number of this tag group found: {matchingTagGroups}");
        }

        tagGroupToAssign = matchingTagGroups.Single ();
    }

    public async Task CreateTaskTypeAsync ()
    {


        var createRequest = new TaskTypeCreateRequest
        {
            Title = TaskType.Title,
        };

        var taskTypeResponse = await _taskRepository.CreateTaskTypeAsync (tagGroupToAssign.ID!.Value, createRequest);

        //Do validation here..

        Refresh.InvokeAsync (true);
    }
}