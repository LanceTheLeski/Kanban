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
    [MapProperty (nameof (DropCard.Id), nameof (Card.Id))]
    [MapProperty (nameof (DropCard.Title), nameof (Card.Title))]
    [MapProperty (nameof (DropCard.PositionID), nameof (Card.PositionID))]
    [MapProperty (nameof (DropCard.Description), nameof (Card.Description))]
    [MapProperty (nameof (DropCard.ColumnNumber), nameof (Card.ColumnNumber))]
    [MapProperty (nameof (DropCard.ColumnID), nameof (Card.ColumnID))]
    [MapProperty (nameof (DropCard.ColumnName), nameof (Card.ColumnName))]
    [MapProperty (nameof (DropCard.SwimlaneNumber), nameof (Card.SwimlaneNumber))]
    [MapProperty (nameof (DropCard.SwimlaneID), nameof (Card.SwimlaneID))]
    [MapProperty (nameof (DropCard.SwimlaneName), nameof (Card.SwimlaneName))]
    [MapProperty (nameof (DropCard.Tasks), nameof (Card.Tasks))]
    public partial DropCard MapCardToDropCard (Card card);
}