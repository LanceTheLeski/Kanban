namespace ArcStrides.UI.Models.Board;

public class Task
{
    public Guid? ID { get; set; } = null;

    public string? Title { get; set; } = null;

    public int? Order { get; set; } = null;

    public TaskType TaskType { get; set; } = null;

    public bool? IsCompleted { get; set; } = null;

    public Timeline? Timeline { get; set; } = null;
}