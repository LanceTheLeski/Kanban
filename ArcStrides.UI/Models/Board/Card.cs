using ArcStrides.Contracts.Response;

namespace ArcStrides.UI.Models.Board;

/// <summary>
/// On principle I suppose these models should correspond to pages and ideally would be 
/// propogated backwards to overlays so specific parts can be changed. Therefore we should 
/// map response objects to these.
/// </summary>
public class Card
{
    public Guid Id { get; set; }

    public string Title { get; set; }

    public string Description { get; set; }

    public Guid BoardID { get; set; }

    public int ColumnNumber { get; set; }

    public Guid ColumnID { get; set; }

    public string ColumnName { get; set; }

    public int SwimlaneNumber { get; set; }

    public Guid SwimlaneID { get; set; }

    public string SwimlaneName { get; set; }

    public List<TaskResponse> Tasks { get; set; }

    //Add tags and metadata-related stuff later
}