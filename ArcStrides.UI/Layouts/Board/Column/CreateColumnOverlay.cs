using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Components.ArcOverlay;

namespace ArcStrides.UI.Layouts.Board.Column;

public partial class CreateColumnOverlay : IArcOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }

    private async System.Threading.Tasks.Task CreateColumnAsync ()
    {
        var createRequest = FormCreateRequestFromOverlay ();

        var columnResponse = await _columnRepository.CreateColumnAsync (BoardID, createRequest);

        await AddToPageAsync (columnResponse);
        CloseOverlay ();
    }

    private ColumnCreateRequest FormCreateRequestFromOverlay ()
    {
        var order = _columnOrder is not null ?
            int.Parse (_columnOrder) :
            Columns.Count ();

        return new ColumnCreateRequest
        {
            Title = _columnTitle,
            Order = order
        };
    }

    private async System.Threading.Tasks.Task AddToPageAsync (ColumnResponse? response)
    {
        if (response is not null)
        {
            Columns.Insert (response!.Order!.Value, response!.ID!.Value);
            await ColumnsChanged.InvokeAsync (Columns);

            ColumnTitles.Insert (response!.Order!.Value, response!.Title!);
            await ColumnTitlesChanged.InvokeAsync (ColumnTitles);

            Refresh.InvokeAsync (true);
        }
    }
}