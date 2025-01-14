using ArcStrides.API.Models.Board;
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

    //[MapProperty (nameof (CardCreateRequest.Title), nameof (CardPosition.Title))]
    //[MapProperty (nameof (CardCreateRequest.Description), nameof (CardPosition.CardDescription))]
    //[MapProperty (nameof (CardCreateRequest.BoardID), nameof (CardPosition.PartitionKey))]
    [MapProperty (nameof (CardCreateRequest.ColumnID), nameof (CardPosition.ColumnID))]
    [MapProperty (nameof (CardCreateRequest.SwimlaneID), nameof (CardPosition.SwimlaneID))]
    public partial CardPosition MapCardCreateRequestToCardPosition (CardCreateRequest cardCreateRequest);

    [MapProperty (nameof (CardPositionPatchRequest.Title), nameof(Card.Title))]
    [MapProperty (nameof (CardPositionPatchRequest.Description), nameof (Card.Description))]
    public partial Card MapCardPatchRequestToCard (CardPositionPatchRequest cardPatchRequest);

    #region Board Card



    #endregion Board Card
}