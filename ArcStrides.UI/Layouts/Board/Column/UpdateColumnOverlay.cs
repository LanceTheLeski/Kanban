using ArcStrides.UI.Components.ArcOverlay;

namespace ArcStrides.UI.Layouts.Board.Column;

public partial class UpdateColumnOverlay: IArcOverlay
{
    public void OpenOverlay ()
        => Open = true;

    public void CloseOverlay ()
    {
        Open = false;
        OpenChanged.InvokeAsync (Open);
    }

    private void GetColumnIndexList ()
    {
        _columnTitleList = Enumerable.Range (0, ColumnTitles.Count ())
                                     .Select (index => $"{index}")
                                     .ToList ();
    }

    private void SetColumnNameToUpdate (string columnName)
    {
        var matchingColumnNameCount = ColumnTitles.FindAll (column => column == columnName).Count ();
        if (matchingColumnNameCount is not 1)
        {
            // Should we throw exceptions? Or have the snackbar display exceptions?
            // I think that the API should throw exceptions and the Blazor UI should maybe use something reliable like the snackbar.
            throw new Exception ($"The column selected does not correspond to a single column in our list of columns. Number of this column found: {matchingColumnNameCount}");
        }

        _columnTitleSelected = columnName;
        _columnTitleReplacement = columnName;
    }

    private async System.Threading.Tasks.Task UpdateColumnAsync ()
    {
        var columnToUpdateListIndex = ColumnTitles.IndexOf (_columnTitleSelected); // Keep in mind that on a given board, column names should be unique.
        var columnToUpdateGuid = Columns [columnToUpdateListIndex];

        var patchRequest = FormPatchRequestFromOverlay ();

        var columnResponse = await _columnRepository.UpdateColumnAsync (BoardID, columnToUpdateGuid, patchRequest);
        // This should return multiple columns that we can set on the board
        
        // We need to update all of the columns to the new list of columns

        Columns.RemoveAt (columnToUpdateListIndex);
        await ColumnsChanged.InvokeAsync (Columns);

        ColumnTitles.RemoveAt (columnToUpdateListIndex);
        await ColumnTitlesChanged.InvokeAsync (ColumnTitles);

        Refresh.InvokeAsync (true); // Some Card info has possibly changed.

        CloseOverlay ();
    }

    private string FormPatchRequestFromOverlay ()
    {
        var patchRequestForTitle = string.IsNullOrWhiteSpace (_columnTitleReplacement) ?
                                        "" :
                                        $@"{{ ""op"": ""replace"", ""path"": ""/Title"", ""value"": ""{_columnTitleReplacement}"" }},";
        var patchRequestForOrder = _columnOrderSelected is -1 ?
                                        "" :
                                        $@"{{ ""op"": ""replace"", ""path"": ""/Order"", ""value"": ""{_columnOrderSelected}"" }}";

        if (patchRequestForTitle is "" && patchRequestForOrder is "")
            return string.Empty;

        return
        $@"[
            {patchRequestForTitle}
            {patchRequestForOrder}
        ]";
    }
}