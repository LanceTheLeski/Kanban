namespace Kanban.Components.DTOs;

public class CardResponse
{
    public string ID {  get; set; }

    public string Title { get; set; }

    public string Description { get; set; }

    public string ColumnID { get; set; }

    public string ColumnName { get; set; }

    public string SwimlaneID { get; set; }

    public string SwimlaneName { get; set; }
}