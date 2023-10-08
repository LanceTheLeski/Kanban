using Kanban.Models;

namespace Kanban.DTOs;

public class BoardResponse
{
    public List<BasicColumn> Columns { get; set; } = new List<BasicColumn> ();

    public List<string> Swimlanes { get; set; } = new List<string> ();

    public class BasicColumn
    {
        public string Title { get; set; }

        public List<BasicSwimlane> Swimlanes { get; set; }
    }

    public class BasicSwimlane
    {
        public string Title { get; set; }

        public List<BasicCard> Cards { get; set; }
    }

    public class BasicCard
    {
        public string Title { get; set; }

        public string Description { get; set; }
    }
}