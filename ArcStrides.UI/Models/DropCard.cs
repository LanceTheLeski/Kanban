namespace ArcStrides.UI.Models;

/// <summary>
/// On principle I suppose these models should correspond to pages and ideally would be 
/// propogated backwards to overlays so specific parts can be changed. Therefore we should 
/// map response objects to these.
/// </summary>
public class DropCard : Card
{
    public string CardArea { get; set; }
}