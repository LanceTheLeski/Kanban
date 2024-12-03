using Kanban.API.Models;
using Kanban.Contracts.Request.Create;
using Kanban.Contracts.Request.Patch;
using Riok.Mapperly.Abstractions;

namespace Kanban.API.Mappers;

[Mapper]
public partial class CardMapper
{
    [MapProperty (nameof (CardCreateRequest.Title), nameof (Card.Title))]
    [MapProperty (nameof (CardCreateRequest.Description), nameof (Card.Description))]
    //[MapProperty (nameof (CardCreateRequest.BoardID), nameof (Card.))]
    //[MapProperty (nameof (CardCreateRequest.ColumnID), nameof (Card))]
    public partial Card MapCardCreateRequestToCard (CardCreateRequest cardCreateRequest);

    [MapProperty (nameof (CardCreateRequest.Title), nameof (BoardCard.Title))]
    [MapProperty (nameof (CardCreateRequest.Description), nameof (BoardCard.CardDescription))]
    [MapProperty (nameof (CardCreateRequest.BoardID), nameof (BoardCard.PartitionKey))]
    [MapProperty (nameof (CardCreateRequest.ColumnID), nameof (BoardCard.ColumnID))]
    [MapProperty (nameof (CardCreateRequest.SwimlaneID), nameof (BoardCard.SwimlaneID))]
    public partial BoardCard MapCardCreateRequestToBoardCard (CardCreateRequest cardCreateRequest);

    [MapProperty (nameof (CardPatchRequest.Title), nameof(Card.Title))]
    [MapProperty (nameof (CardPatchRequest.Description), nameof (Card.Description))]
    public partial Card MapCardPatchRequestToCard (CardPatchRequest cardPatchRequest);
}