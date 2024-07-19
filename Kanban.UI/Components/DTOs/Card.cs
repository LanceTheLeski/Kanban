namespace Kanban.UI.Components.DTOs;

public class Card
{
    public string Id { get; set; }

    public string Title { get; set; }

    public string Description { get; set; }

    public int ColumnNumber { get; set; }

    public Guid ColumnID { get; set; }

    public string ColumnName { get; set; }

    public int SwimlaneNumber { get; set; }

    public Guid SwimlaneID { get; set; }

    public string SwimlaneName { get; set; }

    //Add tags and metadata-related stuff later
}