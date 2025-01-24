using ArcStrides.Contracts.Response;
using ArcStrides.UI.Models;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.UI.Mappers;

[Mapper]
public partial class CardMapper
{
    [MapProperty (nameof (CardPositionResponse.ID), nameof (DropCard.Id))]
    [MapProperty (nameof (CardPositionResponse.Title), nameof (DropCard.Title))]
    [MapProperty (nameof (CardPositionResponse.Description), nameof (DropCard.Description))]
    [MapProperty (nameof (CardPositionResponse.ColumnOrder), nameof (DropCard.ColumnNumber))]
    [MapProperty (nameof (CardPositionResponse.ColumnID), nameof (DropCard.ColumnID))]
    [MapProperty (nameof (CardPositionResponse.ColumnTitle), nameof (DropCard.ColumnName))]
    [MapProperty (nameof (CardPositionResponse.SwimlaneOrder), nameof (DropCard.SwimlaneNumber))]
    [MapProperty (nameof (CardPositionResponse.SwimlaneID), nameof (DropCard.SwimlaneID))]
    [MapProperty (nameof (CardPositionResponse.SwimlaneTitle), nameof (DropCard.SwimlaneName))]
    //CardArea = ConvertColumnAndSwimlaneToCardArea (deserialized.SwimlaneOrder, deserialized.ColumnOrder)
    public partial DropCard MapCardPositionResponseToDropCard (CardPositionResponse boardCardResponse);
}