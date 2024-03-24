namespace Kanban.Components.DTOs.ToPossiblyDelete;

public class Board
{
    public int Id { get; set; }

    public string Name { get; set; }

    public List<Card> Cards { get; set; }
}