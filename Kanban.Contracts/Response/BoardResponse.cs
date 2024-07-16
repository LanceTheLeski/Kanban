namespace Kanban.Contracts.Response;

public class BoardResponse
{
    public string ID { get; set; }

    public string Title { get; set; }

    public List<BasicColumn> Columns { get; set; } = new List<BasicColumn> ();

    public class BasicColumn
    {
        public string ID { get; set; }

        public string Title { get; set; }

        public int Order { get; set; }

        public List<BasicSwimlane> Swimlanes { get; set; }
    }

    public class BasicSwimlane
    {
        public string ID { get; set; }

        public string Title { get; set; }

        public int Order { get; set; }

        public List<BasicCard> Cards { get; set; }
    }

    public class BasicCard
    {
        public string ID { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }
    }
}