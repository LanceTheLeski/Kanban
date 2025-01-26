namespace ArcStrides.API.Models.Board;

public class Swimlane : ArcBoardsEntity
{
    public override string RowKey { get; set; }

    public string Title { get; set; }

    public bool IsVisible { get; set; } = true;

    public int SwimlaneOrder { get; set; }

    public double GlobalSwimlaneOrder { get; set; } //For when we want to quickly create a board on the fly.

    public string SwimlaneColor { get; set; }

    public string GlobalSwimlaneColor { get; set; }

    //public IEnumerable<int> CardIDs { get; set; }
    //public virtual IEnumerable<Card> Cards { get; set; } //Same as columns

    //public IEnumerable<int> TagIDs { get; set; }
    //public virtual IEnumerable<Tag> Tags { get; set; } //Let's return to this later

    //public IEnumerable<int> TriggerIDs { get; set; }
    //public virtual IEnumerable<Trigger> Triggers { get; set; } //Let's return to this later
}