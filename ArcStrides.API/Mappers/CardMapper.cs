using ArcStrides.API.Models.Board;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.API.Mappers;

[Mapper (AllowNullPropertyAssignment = false)]
public partial class CardMapper
{
    /// <summary>
    /// <see cref="CardCreateRequest"/> --> <see cref="Card"/>
    /// </summary>
    [MapProperty (nameof (CardCreateRequest.Title), nameof (Card.Title))]
    [MapProperty (nameof (CardCreateRequest.Description), nameof (Card.Description))]
    [MapProperty (nameof (CardCreateRequest.StartDependencyTagGroupID), nameof (Card.StartDependencyTagGroupID))]
    [MapProperty (nameof (CardCreateRequest.StartPreferenceUTC), nameof (Card.StartPreferenceUTC))]
    [MapProperty (nameof (CardCreateRequest.StartDeadlineUTC), nameof (Card.StartDeadlineUTC))]
    [MapProperty (nameof (CardCreateRequest.EndDependencyTagGroupID), nameof (Card.EndDependencyTagGroupID))]
    [MapProperty (nameof (CardCreateRequest.EndPreferenceUTC), nameof (Card.EndPreferenceUTC))]
    [MapProperty (nameof (CardCreateRequest.EndDeadlineUTC), nameof (Card.EndDeadlineUTC))]
    public partial Card MapCardCreateRequestToCard (CardCreateRequest cardCreateRequest);

    /// <summary>
    /// <see cref="Card"/> --> <see cref="CardPosition"/>
    /// </summary>
    [MapProperty (nameof (Card.PartitionKey), nameof (CardPosition.PartitionKey))]
    [MapProperty (nameof (Card.CardPositionID), nameof (CardPosition.RowKey))]
    [MapProperty (nameof (Card.RowKey), nameof (CardPosition.CardID))]
    public partial CardPosition MapCardToCardPosition (Card card);

    /// <summary>
    /// <see cref="Card"/> --> <see cref="CardPositionResponse"/>
    /// </summary>
    [MapProperty (nameof (Card.CardPositionID), nameof (CardPositionResponse.ID))]
    [MapProperty (nameof (Card.Title), nameof (CardPositionResponse.Title))]
    [MapProperty (nameof (Card.Description), nameof (CardPositionResponse.Description))]
    [MapProperty (nameof (Card.PartitionKey), nameof (CardPositionResponse.BoardID))]
    public partial CardPositionResponse MapCardToCardPositionResponse (Card card);

    [MapProperty (nameof (Card.RowKey), nameof (CardResponse.ID))]
    [MapProperty (nameof (Card.Title), nameof (CardResponse.Title))]
    [MapProperty (nameof (Card.Description), nameof (CardResponse.Description))]
    public partial CardResponse MapCardToCardResponse (Card card);

    #region CardPosition

    /// <summary>
    /// <see cref="CardPosition"/> --> <see cref="CardPositionResponse"/>
    /// </summary>
    [MapProperty (nameof (CardPosition.PartitionKey), nameof (CardPositionResponse.BoardID))]
    [MapProperty (nameof (CardPosition.RowKey), nameof (CardPositionResponse.ID))]
    [MapProperty (nameof (CardPosition.ColumnID), nameof (CardPositionResponse.ColumnID))]
    [MapProperty (nameof (CardPosition.ColumnTitle), nameof (CardPositionResponse.ColumnTitle))]
    [MapProperty (nameof (CardPosition.ColumnOrder), nameof (CardPositionResponse.ColumnOrder))]
    [MapProperty (nameof (CardPosition.SwimlaneID), nameof (CardPositionResponse.SwimlaneID))]
    [MapProperty (nameof (CardPosition.SwimlaneTitle), nameof (CardPositionResponse.SwimlaneTitle))]
    [MapProperty (nameof (CardPosition.SwimlaneOrder), nameof (CardPositionResponse.SwimlaneOrder))]
    public partial CardPositionResponse MapCardPositionToCardPositionResponse (CardPosition cardPosition);

    /// <summary>
    /// <see cref="CardCreateRequest"/> --> <see cref="CardPosition"/>
    /// </summary>
    [MapProperty (nameof (CardCreateRequest.ColumnID), nameof (CardPosition.ColumnID))]
    [MapProperty (nameof (CardCreateRequest.SwimlaneID), nameof (CardPosition.SwimlaneID))]
    public partial CardPosition MapCardCreateRequestToCardPosition (CardCreateRequest cardCreateRequest);

    /// <summary>
    /// <see cref="CardPositionPatchRequest"/> --> <see cref="CardPosition"/>
    /// </summary>
    [MapProperty (nameof (CardPosition.ColumnID), nameof (CardPositionPatchRequest.ColumnID))]
    [MapProperty (nameof (CardPosition.ColumnTitle), nameof (CardPositionPatchRequest.ColumnTitle))]
    [MapProperty (nameof (CardPosition.ColumnOrder), nameof (CardPositionPatchRequest.ColumnOrder))]
    [MapProperty (nameof (CardPosition.SwimlaneID), nameof (CardPositionPatchRequest.SwimlaneID))]
    [MapProperty (nameof (CardPosition.SwimlaneTitle), nameof (CardPositionPatchRequest.SwimlaneTitle))]
    [MapProperty (nameof (CardPosition.SwimlaneOrder), nameof (CardPositionPatchRequest.SwimlaneOrder))]
    public partial CardPosition MapCardPatchRequestToCard (CardPositionPatchRequest cardPatchRequest);

    #endregion CardPosition
}