using ArcStrides.UI.Components.ArcOverlay;

namespace ArcStrides.UI.Layouts.Board.Column;

public partial class DeleteColumnOverlay : IArcOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }

    private void SetColumnNameToDelete (string columnName)
    {
        var matchingColumnNameCount = ColumnTitles.FindAll (column => column == columnName).Count ();
        if (matchingColumnNameCount is not 1)
        {
            // Should we throw exceptions? Or have the snackbar display exceptions?
            // I think that the API should throw exceptions and the Blazor UI should maybe use something reliable like the snackbar.
            throw new Exception ($"The column selected does not correspond to a single column in our list of columns. Number of this column found: {matchingColumnNameCount}");
        }
        //Replace with FluentValidation in the cs partial class. If it fails then use the Snackbar to display the error.

        _columnTitleSelected = columnName;
    }

    private async System.Threading.Tasks.Task RemoveColumnAsync ()
    {
        var columnToDeleteListIndex = ColumnTitles.IndexOf (_columnTitleSelected); // Keep in mind that on a given board, column names should be unique.
        var columnToDeleteGuid = Columns [columnToDeleteListIndex];

        await _columnRepository.DeleteColumnAsync (BoardID, columnToDeleteGuid);

        await RemoveFromPageAsync (columnToDeleteListIndex);
        CloseOverlay ();
    }

    private async System.Threading.Tasks.Task RemoveFromPageAsync (int columnToDeleteIndex)
    {
        Columns.RemoveAt (columnToDeleteIndex);
        await ColumnsChanged.InvokeAsync (Columns);

        ColumnTitles.RemoveAt (columnToDeleteIndex);
        await ColumnTitlesChanged.InvokeAsync (ColumnTitles);

        Refresh.InvokeAsync (true);
    }
}