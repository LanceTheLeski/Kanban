using ArcStrides.API.Attributes;

namespace ArcStrides.API.Models.Board;

[ArcTableName ("CardPositions")]
public class CardPosition : ArcBoardsEntity
{
    public override string RowKey { get; set; }

    public Guid CardID { get; set; }

    public bool IsVisible { get; set; } = true;

    /// <summary>
    /// The swimlane the card is in, or <see cref="Guid.Empty"/> for none.
    /// </summary>
    /// <remarks>
    /// A board may have no swimlanes; its cards then sit straight in their columns.
    /// Deleting the last swimlane takes every card out of it this way, and adding a
    /// swimlane to such a board puts them all into it (SwimlaneRepository). An empty
    /// ID rather than a null, because the row is written with a merge, which leaves a
    /// null out and would keep the old swimlane (docs/api-gaps.md, #9).
    ///
    /// A card is never in no column: the last column cannot be deleted while it
    /// holds cards.
    /// </remarks>
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