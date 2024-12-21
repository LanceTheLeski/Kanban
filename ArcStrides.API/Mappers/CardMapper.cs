using ArcStrides.API.Models;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.API.Mappers;

[Mapper]
public partial class CardMapper : ICardMapper
{
    [MapProperty (nameof (CardCreateRequest.TagID), nameof (Card.RowKey))]
    [MapProperty (nameof (CardCreateRequest.Title), nameof (Card.Title))]
    [MapProperty (nameof (CardCreateRequest.Description), nameof (Card.Description))]
    [MapProperty (nameof (CardCreateRequest.StartDependencyTagGroupID), nameof (Card.StartDependencyTagGroupID))]
    [MapProperty (nameof (CardCreateRequest.StartPreferenceUTC), nameof (Card.StartPreferenceUTC))]
    [MapProperty (nameof (CardCreateRequest.StartDeadlineUTC), nameof (Card.StartDeadlineUTC))]
    [MapProperty (nameof (CardCreateRequest.EndDependencyTagGroupID), nameof (Card.EndDependencyTagGroupID))]
    [MapProperty (nameof (CardCreateRequest.EndPreferenceUTC), nameof (Card.EndPreferenceUTC))]
    [MapProperty (nameof (CardCreateRequest.EndDeadlineUTC), nameof (Card.EndDeadlineUTC))]
    public partial Card MapCardCreateRequestToCard (CardCreateRequest cardCreateRequest);

    [MapProperty (nameof (CardCreateRequest.Title), nameof (BoardCard.Title))]
    [MapProperty (nameof (CardCreateRequest.Description), nameof (BoardCard.CardDescription))]
    [MapProperty (nameof (CardCreateRequest.BoardID), nameof (BoardCard.PartitionKey))]
    [MapProperty (nameof (CardCreateRequest.ColumnID), nameof (BoardCard.ColumnID))]
    [MapProperty (nameof (CardCreateRequest.SwimlaneID), nameof (BoardCard.SwimlaneID))]
    public partial BoardCard MapCardCreateRequestToBoardCard (CardCreateRequest cardCreateRequest);

    [MapProperty (nameof (BoardCardPatchRequest.Title), nameof(Card.Title))]
    [MapProperty (nameof (BoardCardPatchRequest.Description), nameof (Card.Description))]
    public partial Card MapCardPatchRequestToCard (BoardCardPatchRequest cardPatchRequest);

    #region Board Card



    #endregion Board Card
}