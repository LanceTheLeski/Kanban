using ArcStrides.API.Attributes;

namespace ArcStrides.API.Models.Board;

[ArcTableName ("CardPositions")]
public class CardPosition : ArcBoardsEntity
{
    public override string RowKey { get; set; }

    public Guid CardID { get; set; }

    public bool IsVisible { get; set; } = true;

    public Guid SwimlaneID { get; set; }

    public string SwimlaneTitle { get; set; }

    public int SwimlaneOrder { get; set; }

    public Guid ColumnID { get; set; }

    public string ColumnTitle { get; set; }

    public int ColumnOrder { get; set; }

    /// <summary>
    /// The rank of the card within its cell (column and swimlane). A lower number indicates a higher position (closer to the top) in the cell.
    /// </summary>
    public int PositionRank { get; set; }
}