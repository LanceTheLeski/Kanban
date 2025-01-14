namespace ArcStrides.Contracts.Request.Create;

public class CardCreateRequest
{
    public string Title { get; set; }

    public string Description { get; set; }

    public Guid TagID { get; set; } //Row Key for the Card

    public Guid? StartDependencyTagGroupID { get; set; }

    public DateTime? StartPreferenceUTC { get; set; }

    public DateTime? StartDeadlineUTC { get; set; }

    public Guid? EndDependencyTagGroupID { get; set; }

    public DateTime? EndPreferenceUTC { get; set; }

    public DateTime? EndDeadlineUTC { get; set; }

    //public Guid BoardID { get; set; } //Partition Key for the BoardCard

    public Guid ColumnID { get; set; }

    public Guid SwimlaneID { get; set; }
}