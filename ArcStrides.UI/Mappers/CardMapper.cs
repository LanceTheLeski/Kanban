using ArcStrides.Contracts.Response;
using ArcStrides.UI.Models.Board;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.UI.Mappers;

[Mapper]
public partial class CardMapper
{
    /// <summary>
    /// <see cref="CardPositionResponse"/> --> <see cref="Card"/>
    /// </summary>
    [MapProperty (nameof (CardPositionResponse.ID), nameof (Card.Id))]
    [MapProperty (nameof (CardPositionResponse.Title), nameof (Card.Title))]
    [MapProperty (nameof (CardPositionResponse.Description), nameof (Card.Description))]
    [MapProperty (nameof (CardPositionResponse.ColumnOrder), nameof (Card.ColumnNumber))]
    [MapProperty (nameof (CardPositionResponse.ColumnID), nameof (Card.ColumnID))]
    [MapProperty (nameof (CardPositionResponse.ColumnTitle), nameof (Card.ColumnName))]
    [MapProperty (nameof (CardPositionResponse.SwimlaneOrder), nameof (Card.SwimlaneNumber))]
    [MapProperty (nameof (CardPositionResponse.SwimlaneID), nameof (Card.SwimlaneID))]
    [MapProperty (nameof (CardPositionResponse.SwimlaneTitle), nameof (Card.SwimlaneName))]
    public partial Card MapCardPositionResponseToCard (CardPositionResponse boardCardResponse);
}