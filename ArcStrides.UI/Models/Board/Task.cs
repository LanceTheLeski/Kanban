namespace ArcStrides.UI.Models.Board;

public class Task
{
    public Guid? ID { get; init; } = null;

    public string? Title { get; init; } = null;

    public TaskType TaskType { get; init; } = null;

    public bool? isCompleted { get; init; } = null;
}