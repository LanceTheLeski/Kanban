namespace Kanban.Components.DTOs.ToPossiblyDelete;

public class Card
{
    public Guid Id { get; set; }

    public string Title { get; set; }

    public string Description { get; set; }

    public int ColumnNumber { get; set; }

    public int RowNumber { get; set; }

    //Add tags and metadata-related stuff later
}