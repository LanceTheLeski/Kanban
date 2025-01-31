using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Components.ArcOverlay;

namespace ArcStrides.UI.Layouts.Board.Swimlane;

public partial class CreateSwimlaneOverlay : IArcOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }

    private async System.Threading.Tasks.Task CreateSwimlaneAsync ()
    {
        var createRequest = FormCreateRequestFromOverlay ();

        var swimlaneResponse = await _swimlaneRepository.CreateSwimlaneAsync (BoardID, createRequest);

        await AddToPageAsync (swimlaneResponse);
        CloseOverlay ();
    }

    private SwimlaneCreateRequest FormCreateRequestFromOverlay ()
    {
        var order = _swimlaneOrder is not null ?
            int.Parse (_swimlaneOrder) :
            Swimlanes.Count ();

        return new SwimlaneCreateRequest
        {
            Title = _swimlaneTitle,
            Order = order
        };
    }

    private async System.Threading.Tasks.Task AddToPageAsync (SwimlaneResponse? response)
    {
        if (response is not null)
        {
            Swimlanes.Insert (response!.Order!.Value, response!.ID!.Value);
            await SwimlanesChanged.InvokeAsync (Swimlanes);

            SwimlaneTitles.Insert (response!.Order!.Value, response!.Title!);
            await SwimlaneTitlesChanged.InvokeAsync (SwimlaneTitles);

            Refresh.InvokeAsync (true);
        }
    }
}