namespace Kanban.Models.Board
{
    public class Board
    {
        public int ID { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public IEnumerable<BoardColumn> Columns { get; set; }//Ordered for board. Includes name, partition id, tags(?)

        public IEnumerable<BoardSwimlane> Swimlanes { get; set; }//Ordered for board. Includes name, partition id, tags(?)

        public IEnumerable<int> Cards { get; set; }//Is this wise? It will keep cards centralized

        public IEnumerable<Tag> Tags { get; set; }

        //Settings..
    }
}