using ArcStrides.Contracts.Response;
using ArcStrides.UI.Models.Board;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.UI.Mappers;

[Mapper]
public partial class CardMapper
{
    /// <summary>
    /// <see cref="CardResponse"/> --> <see cref="Card"/>
    /// </summary>
    [MapProperty (nameof (CardResponse.ID), nameof (Card.Id))]
    [MapProperty (nameof (CardResponse.Title), nameof (Card.Title))]
    [MapProperty (nameof (CardResponse.Description), nameof (Card.Description))]
    [MapProperty (nameof (CardResponse.Position.ID), nameof (Card.PositionID))]
    [MapProperty (nameof (CardResponse.Position.BoardID), nameof (Card.BoardID))]
    [MapProperty (nameof (CardResponse.Position.ColumnOrder), nameof (Card.ColumnNumber))]
    [MapProperty (nameof (CardResponse.Position.ColumnID), nameof (Card.ColumnID))]
    [MapProperty (nameof (CardResponse.Position.ColumnTitle), nameof (Card.ColumnName))]
    [MapProperty (nameof (CardResponse.Position.SwimlaneOrder), nameof (Card.SwimlaneNumber))]
    [MapProperty (nameof (CardResponse.Position.SwimlaneID), nameof (Card.SwimlaneID))]
    [MapProperty (nameof (CardResponse.Position.SwimlaneTitle), nameof (Card.SwimlaneName))]
    [MapProperty (nameof (CardResponse.Tasks), nameof (Card.Tasks))]
    public partial Card MapCardResponseToCard (CardResponse cardResponse);

    /// <summary>
    /// <see cref="CardPositionResponse"/> --> <see cref="Card"/>
    /// </summary>
    [MapProperty (nameof (CardPositionResponse.ID), nameof (Card.PositionID))]
    [MapProperty (nameof (CardPositionResponse.Title), nameof (Card.Title))]
    [MapProperty (nameof (CardPositionResponse.Description), nameof (Card.Description))]
    [MapProperty (nameof (CardPositionResponse.ColumnOrder), nameof (Card.ColumnNumber))]
    [MapProperty (nameof (CardPositionResponse.ColumnID), nameof (Card.ColumnID))]
    [MapProperty (nameof (CardPositionResponse.ColumnTitle), nameof (Card.ColumnName))]
    [MapProperty (nameof (CardPositionResponse.SwimlaneOrder), nameof (Card.SwimlaneNumber))]
    [MapProperty (nameof (CardPositionResponse.SwimlaneID), nameof (Card.SwimlaneID))]
    [MapProperty (nameof (CardPositionResponse.SwimlaneTitle), nameof (Card.SwimlaneName))]
    public partial Card MapCardPositionResponseToCard (CardPositionResponse boardCardResponse);

    /// <summary>
    /// <see cref="Card"/> --> <see cref="DropCard"/>
    /// </summary>
    [MapProperty (nameof (Card.Id), nameof (DropCard.Card.Id))]
    [MapProperty (nameof (Card.Title), nameof (DropCard.Card.Title))]
    [MapProperty (nameof (Card.PositionID), nameof (DropCard.Card.PositionID))]
    [MapProperty (nameof (Card.Description), nameof (DropCard.Card.Description))]
    [MapProperty (nameof (Card.ColumnNumber), nameof (DropCard.Card.ColumnNumber))]
    [MapProperty (nameof (Card.ColumnID), nameof (DropCard.Card.ColumnID))]
    [MapProperty (nameof (Card.ColumnName), nameof (DropCard.Card.ColumnName))]
    [MapProperty (nameof (Card.SwimlaneNumber), nameof (DropCard.Card.SwimlaneNumber))]
    [MapProperty (nameof (Card.SwimlaneID), nameof (DropCard.Card.SwimlaneID))]
    [MapProperty (nameof (Card.SwimlaneName), nameof (DropCard.Card.SwimlaneName))]
    [MapProperty (nameof (Card.Tasks), nameof (DropCard.Card.Tasks))]
    public partial DropCard MapCardToDropCard (Card card);
}