using ArcStrides.API.Attributes;

namespace ArcStrides.API.Models.Board;

[ArcTableName ("Tasks")]
public class Task : ArcBoardsEntity
{
    /// <summary>
    /// Task ID (as Guid).
    /// </summary>
    public override string? RowKey { get; set; }

    public string? Title { get; set; }

    public Guid? CardID { get; set; } //Parent Card

    public int? TaskTypeID { get; set; }

    public int? TaskOrder { get; set; }

    public bool? IsComplete { get; set; }

    public Guid? TimelineID { get; set; }
}