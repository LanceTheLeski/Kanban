using ArcStrides.API.Models.Board;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;

namespace ArcStrides.API.Mappers;

public interface ICardMapper
{
    /// <summary>
    /// <see cref="CardCreateRequest"/> --> <see cref="Card"/>
    /// </summary>
    Card MapCardCreateRequestToCard (CardCreateRequest cardCreateRequest);

    /// <summary>
    /// <see cref="Card"/> --> <see cref="CardPosition"/>
    /// </summary>
    CardPosition MapCardToCardPosition (Card card);

    /// <summary>
    /// <see cref="Card"/> --> <see cref="CardPositionResponse"/>
    /// </summary>
    CardPositionResponse MapCardToCardPositionResponse (Card card);

    /// <summary>
    /// <see cref="Card"/> --> <see cref="CardResponse"/>
    /// </summary>
    CardResponse MapCardToCardResponse (Card card);

    #region CardPosition

    /// <summary>
    /// <see cref="CardPosition"/> --> <see cref="CardPositionResponse"/>
    /// </summary>
    CardPositionResponse MapCardPositionToCardPositionResponse (CardPosition cardPosition);

    /// <summary>
    /// <see cref="CardCreateRequest"/> --> <see cref="CardPosition"/>
    /// </summary>
    CardPosition MapCardCreateRequestToCardPosition (CardCreateRequest cardCreateRequest);

    /// <summary>
    /// <see cref="CardPositionPatchRequest"/> --> <see cref="CardPosition"/>
    /// </summary>
    CardPosition MapCardPatchRequestToCard (CardPositionPatchRequest cardPatchRequest);

    #endregion CardPosition
}