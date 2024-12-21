using Azure;
using Azure.Data.Tables;

namespace ArcStrides.API.Models;

//We're going to want to swap partition key and row key if we want transactions to work.
public class Column : ITableEntity
{
    public string PartitionKey { get; set; } //Required -- Column ID

    public string RowKey { get; set; } //Required -- Board ID 

    public DateTimeOffset? Timestamp { get; set; } //Required

    public ETag ETag { get; set; } //Required ??

    public string Title { get; set; }

    public bool IsVisible { get; set; } = true;

    public int ColumnOrder { get; set; } //For the given board

    public double GlobalColumnOrder {  get; set; } //For when we want to quickly create a board on the fly.

    public string ColumnColor { get; set; }

    public string GlobalColumnColor { get; set; }

    public string BoardTitle { get; set; }

    public Column DeepCopy () //This should probably get removed.
        => new Column
        {
            PartitionKey = this.PartitionKey,
            RowKey = this.RowKey,
            Timestamp = this.Timestamp,
            ETag = this.ETag,
            Title = this.Title,
            IsVisible = this.IsVisible,
            ColumnOrder = this.ColumnOrder,
            BoardTitle = this.BoardTitle
        };

    //public IEnumerable<int> TagIDs { get; set; }
    //public virtual IEnumerable<Tag> Tags { get; set; } //Let's return to this later

    //public virtual IEnumerable<Card> Cards { get; set; } //I'm not sure about this now that I'm tying columns to boards?

    //public IEnumerable<int> TriggerIDs { get; set; }
    //public virtual IEnumerable<Trigger> Triggers { get; set; } //Let's return to this later
}