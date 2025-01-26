namespace ArcStrides.API.Models.Board;

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
}