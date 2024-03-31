namespace Kanban.Components.DTOs;

public class CardPatchRequest
{
    public string Title { get; set; }

    public string Description {  get; set; }
    
    public string ColumnID { get; set; }

    public string ColumnName { get; set; }

    public string SwimlaneID { get; set; }

    public string SwimlaneName { get; set; }
}