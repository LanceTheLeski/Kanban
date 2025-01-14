using ArcStrides.Contracts.Response;
using System.Collections.ObjectModel;

namespace ArcStrides.UI.Models;

public class Board
{
    public Collection<BasicColumn> Columns { get; set; } = new Collection<BasicColumn> ();

    public class BasicColumn
    {
        public string ID { get; set; }

        public string Title { get; set; }

        public int Order { get; set; }

        public Collection<BasicSwimlane> Swimlanes { get; set; }
    }

    public class BasicSwimlane
    {
        public string ID { get; set; }

        public string Title { get; set; }

        public int Order { get; set; }

        public Collection<BasicCard> Cards { get; set; }
    }

    public class BasicCard
    {
        public string ID { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public Collection<TaskResponse> Tasks { get; set; }
    }
}