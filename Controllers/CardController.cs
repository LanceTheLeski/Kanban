using Azure.Data.Tables;
using Kanban.Components.DTOs;
using Kanban.Contexts;
using Kanban.Models;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Kanban.Controllers;

[ApiController]
[Route ("kanban/cards")]
public class CardController : ControllerBase
{
    private const string boards = "Boards";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _boardTable;

    public CardController (IOptions<CosmosOptions> cosmosOptions)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _boardTable = _tableServiceClient.GetTableClient (tableName: boards);
    }

    [HttpGet ("getcard")]
    public ActionResult GetCard ()
    {
        //todo
        return StatusCode (StatusCodes.Status200OK, new Card ());
    }

    //[HttpPost ("createcard")]
    public ActionResult CreateCard ()
    {
        //todo
        return StatusCode (StatusCodes.Status418ImATeapot);
    }

    [HttpPatch ("updatecard/{ID:guid}")]
    public async Task<ActionResult> UpdateCard (Guid ID, [FromBody] JsonPatchDocument<CardPatchRequest> cardPatchRequest)
    {
        if (cardPatchRequest is null)
        {
            return BadRequest ("There was no Patch Request passed in!");
        }

        var boardList = new List<Board> ();
        var boardsFromTable = await _boardTable.GetEntityAsync<Board> (partitionKey: @"20a88077-10d4-4648-92cb-7dc7ba5b8df5", rowKey: ID.ToString());

        var cardToUpdate = boardsFromTable.Value;

        var convertedCardToUpdate = new CardPatchRequest
        {
            Title = cardToUpdate.CardTitle,
            Description = cardToUpdate.CardDescription,
            ColumnID = cardToUpdate.ColumnID.ToString (),
            ColumnTitle = cardToUpdate.ColumnTitle,
            ColumnOrder = cardToUpdate.ColumnOrder,
            SwimlaneID = cardToUpdate.SwimlaneID.ToString (),
            SwimlaneTitle = cardToUpdate.SwimlaneTitle,
            SwimlaneOrder = cardToUpdate.SwimlaneOrder
        };

        cardPatchRequest.ApplyTo (convertedCardToUpdate); //Could add a ModelState validation somewhere here as well..

        cardToUpdate.CardTitle = convertedCardToUpdate.Title;
        cardToUpdate.CardDescription = convertedCardToUpdate.Description;
        cardToUpdate.ColumnID = Guid.Parse (convertedCardToUpdate.ColumnID);
        cardToUpdate.ColumnTitle = convertedCardToUpdate.ColumnTitle;
        cardToUpdate.ColumnOrder = convertedCardToUpdate.ColumnOrder;
        cardToUpdate.SwimlaneID = Guid.Parse (convertedCardToUpdate.SwimlaneID);
        cardToUpdate.SwimlaneTitle = convertedCardToUpdate.SwimlaneTitle;
        cardToUpdate.SwimlaneOrder = convertedCardToUpdate.SwimlaneOrder;

        var response = await _boardTable.UpdateEntityAsync (cardToUpdate, Azure.ETag.All);
        if (response.IsError) 
        {
            return BadRequest ($"Could not update card. Internal status: {response.Status}");
        }

        var cardResponse = new CardResponse
        {
            ID = cardToUpdate.RowKey,
            Title = cardToUpdate.CardTitle,
            Description = cardToUpdate.CardDescription,
            ColumnID = cardToUpdate.ColumnID.ToString (),
            ColumnTitle = cardToUpdate.ColumnTitle,
            ColumnOrder = cardToUpdate.ColumnOrder,
            SwimlaneID = cardToUpdate.SwimlaneID.ToString (),
            SwimlaneTitle = cardToUpdate.SwimlaneTitle,
            SwimlaneOrder = cardToUpdate.SwimlaneOrder
        };

        return Ok (cardResponse);
    }
}