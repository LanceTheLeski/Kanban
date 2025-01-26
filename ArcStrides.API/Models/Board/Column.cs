namespace ArcStrides.API.Models.Board;

public class Column : ArcBoardsEntity
{
    public Guid ColumnID { get; set => EntityID = ColumnID.ToString (); }

    public string Title { get; set; }

    public bool IsVisible { get; set; } = true;

    public int ColumnOrder { get; set; } //For the given board

    public double GlobalColumnOrder { get; set; } //For when we want to quickly create a board on the fly.

    public string ColumnColor { get; set; }

    public string GlobalColumnColor { get; set; }
}