using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Components.ArcOverlay;
using ArcStrides.UI.Repositories;

namespace ArcStrides.UI.Layouts.Board.Column;

public partial class CreateColumnOverlay : IArcOverlay
{
    private readonly IColumnRepository _columnRepository;

    public CreateColumnOverlay (IColumnRepository columnRepository)
    {
        _columnRepository = columnRepository;
    }

    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }

    private async Task<ColumnResponse?> CreateColumn ()
    {
        var order = columnOrder is not null ?
            int.Parse (columnOrder) :
            Columns.Count ();
        var createRequest = new ColumnCreateRequest
        {
            Title = columnTitle,
            Order = order
        };

        var response = await _columnRepository.CreateColumnAsync (BoardID, createRequest);
        if (response is not null)
        {
            Columns.Insert (response.Order.Value, response.ID.Value);
            await ColumnsChanged.InvokeAsync (Columns);

            ColumnTitles.Insert (response.Order.Value, response.Title);
            await ColumnTitlesChanged.InvokeAsync (ColumnTitles);

            Refresh.InvokeAsync (true);
        }

        CloseOverlay ();
        return response;
    }
}