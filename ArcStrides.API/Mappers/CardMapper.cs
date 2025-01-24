using ArcStrides.API.Models.Board;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.API.Mappers;

[Mapper]
public partial class CardMapper : ICardMapper
{
    [MapProperty (nameof (CardCreateRequest.Title), nameof (Card.Title))]
    [MapProperty (nameof (CardCreateRequest.Description), nameof (Card.Description))]
    [MapProperty (nameof (CardCreateRequest.StartDependencyTagGroupID), nameof (Card.StartDependencyTagGroupID))]
    [MapProperty (nameof (CardCreateRequest.StartPreferenceUTC), nameof (Card.StartPreferenceUTC))]
    [MapProperty (nameof (CardCreateRequest.StartDeadlineUTC), nameof (Card.StartDeadlineUTC))]
    [MapProperty (nameof (CardCreateRequest.EndDependencyTagGroupID), nameof (Card.EndDependencyTagGroupID))]
    [MapProperty (nameof (CardCreateRequest.EndPreferenceUTC), nameof (Card.EndPreferenceUTC))]
    [MapProperty (nameof (CardCreateRequest.EndDeadlineUTC), nameof (Card.EndDeadlineUTC))]
    public partial Card MapCardCreateRequestToCard (CardCreateRequest cardCreateRequest);

    [MapProperty (nameof (Card.PartitionKey), nameof (CardPosition.PartitionKey))]
    [MapProperty (nameof (Card.CardPositionID), nameof (CardPosition.RowKey))]
    public partial CardPosition MapCardToCardPosition (Card card);

    [MapProperty (nameof (Card.CardPositionID), nameof (CardPositionResponse.ID))]
    [MapProperty (nameof (Card.Title), nameof (CardPositionResponse.Title))]
    [MapProperty (nameof (Card.Description), nameof (CardPositionResponse.Description))]
    public partial CardPositionResponse MapCardToCardPositionResponse (Card card);

    #region CardPosition

    [MapProperty (nameof (CardPosition.RowKey), nameof (CardPositionResponse.ID))]
    [MapProperty (nameof (CardPosition.ColumnID), nameof (CardPositionResponse.ColumnID))]
    [MapProperty (nameof (CardPosition.ColumnTitle), nameof (CardPositionResponse.ColumnTitle))]
    [MapProperty (nameof (CardPosition.ColumnOrder), nameof (CardPositionResponse.ColumnOrder))]
    [MapProperty (nameof (CardPosition.SwimlaneID), nameof (CardPositionResponse.SwimlaneID))]
    [MapProperty (nameof (CardPosition.SwimlaneTitle), nameof (CardPositionResponse.SwimlaneTitle))]
    [MapProperty (nameof (CardPosition.SwimlaneOrder), nameof (CardPositionResponse.SwimlaneOrder))]
    public partial CardPositionResponse MapCardPositionToCardPositionResponse (CardPosition cardPosition);

    //[MapProperty (nameof (CardCreateRequest.Title), nameof (CardPosition.Title))]
    //[MapProperty (nameof (CardCreateRequest.Description), nameof (CardPosition.CardDescription))]
    //[MapProperty (nameof (CardCreateRequest.BoardID), nameof (CardPosition.PartitionKey))]
    [MapProperty (nameof (CardCreateRequest.ColumnID), nameof (CardPosition.ColumnID))]
    [MapProperty (nameof (CardCreateRequest.SwimlaneID), nameof (CardPosition.SwimlaneID))]
    public partial CardPosition MapCardCreateRequestToCardPosition (CardCreateRequest cardCreateRequest);

    [MapProperty (nameof (CardPosition.ColumnID), nameof (CardPositionPatchRequest.ColumnID))]
    [MapProperty (nameof (CardPosition.ColumnTitle), nameof (CardPositionPatchRequest.ColumnTitle))]
    [MapProperty (nameof (CardPosition.ColumnOrder), nameof (CardPositionPatchRequest.ColumnOrder))]
    [MapProperty (nameof (CardPosition.SwimlaneID), nameof (CardPositionPatchRequest.SwimlaneID))]
    [MapProperty (nameof (CardPosition.SwimlaneTitle), nameof (CardPositionPatchRequest.SwimlaneTitle))]
    [MapProperty (nameof (CardPosition.SwimlaneOrder), nameof (CardPositionPatchRequest.SwimlaneOrder))]
    public partial CardPosition MapCardPatchRequestToCard (CardPositionPatchRequest cardPatchRequest);

    #endregion CardPosition
}