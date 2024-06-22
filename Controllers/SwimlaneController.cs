using Azure.Data.Tables;
using Kanban.Components.DTOs;
using Kanban.Contexts;
using Kanban.Models;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Kanban.Controllers;

[ApiController]
[Route ("kanban/swimlanes")]
public class SwimlaneController : Controller //We should remove the SwimlaneOrder and SwimlaneTitle from the Board Table 
{
    private const string boards = "Boards";
    private const string swimlanes = "Swimlanes";
    private const string cards = "Cards";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _boardTable;
    private readonly TableClient _swimlaneTable;
    private readonly TableClient _cardTable;

    public SwimlaneController (IOptions<CosmosOptions> cosmosOptions)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _boardTable = _tableServiceClient.GetTableClient (tableName: boards);
        _swimlaneTable = _tableServiceClient.GetTableClient (tableName: swimlanes);
        _cardTable = _tableServiceClient.GetTableClient (tableName: cards);
    }

    [HttpGet ("fetch/{ID:Guid}")]
    public async Task<ActionResult> FetchSwimlane (Guid ID)
    {
        var swimlaneList = new List<Swimlane> ();
        var swimlanesFromTable = _swimlaneTable.QueryAsync<Swimlane> (swimlane => swimlane.PartitionKey == ID.ToString ());
        await foreach (var swimlane in swimlanesFromTable)
            swimlaneList.Add (swimlane);

        //If multiple boards have the same swimlane then there will be multiple results here. I think we only need to grab the first for now
        if (swimlaneList.Count () is 0)
            return NotFound ("The column you are searching for was not found.");

        var swimlaneToReturn = swimlaneList.First ();
        var swimlaneResponse = new ColumnResponse
        {
            ID = Guid.Parse (swimlaneToReturn.PartitionKey),
            Title = swimlaneToReturn.Title,
            BoardID = Guid.Parse (swimlaneToReturn.RowKey), //Might be an issue later if we need another board's swimlane
            Order = swimlaneToReturn.SwimlaneOrder
        };

        return Ok (swimlaneResponse);
    }

    [HttpPost ("create")]
    public async Task<ActionResult> CreateSwimlane ([FromBody] SwimlaneCreateRequest swimlaneCreateRequest)
    {
        if (swimlaneCreateRequest is null)
        {
            return BadRequest ("There was no Swimlane Request passed in!");
        }

        Board boardFromTable = null;
        var boardsFromTable = _boardTable.QueryAsync<Board> (board => board.PartitionKey == swimlaneCreateRequest.BoardID.ToString ());
        await foreach (var board in boardsFromTable)//This is VERY inefficient. I want to 
            boardFromTable = board;
        if (boardFromTable is null)
        {
            return BadRequest ("The board ID passed in does not exist.");
        }

        var newSwimlaneID = Guid.NewGuid ();
        var newSwimlane = new Swimlane
        {
            PartitionKey = newSwimlaneID.ToString (),
            RowKey = swimlaneCreateRequest.BoardID.ToString (),

            Title = swimlaneCreateRequest.Title,
            SwimlaneOrder = swimlaneCreateRequest.Order,

            BoardTitle = boardFromTable.Title
        };

        var addEntityResponse = await _swimlaneTable.AddEntityAsync (newSwimlane);//Do we need to update the boardTable as well?
        if (addEntityResponse.IsError)
        {
            //We might want to have better verification later for failures. I'm thinking we actually query the table and grab the swimlane so we can map it to a response object
            return StatusCode (StatusCodes.Status500InternalServerError, $"Could not insert a new swimlane into database. Internal status: {addEntityResponse.Status}");
        }

        var swimlaneResponse = new SwimlaneResponse
        {
            ID = Guid.Parse (newSwimlane.PartitionKey),
            Title = newSwimlane.Title,
            BoardID = Guid.Parse (newSwimlane.RowKey),
            Order = newSwimlane.SwimlaneOrder
        };

        return StatusCode (StatusCodes.Status201Created, swimlaneResponse);
    }

    [HttpPatch ("updates/{ID:Guid}")]
    public async Task<ActionResult> UpdateSwimlane (Guid ID, [FromBody] JsonPatchDocument<SwimlanePatchRequest> swimlanePatchRequest)
    {
        if (swimlanePatchRequest is null)
        {
            return BadRequest ("There was no Patch Request passed in!");
        }

        var swimlaneFromTable = await _swimlaneTable.GetEntityAsync<Swimlane> (partitionKey: ID.ToString (), rowKey: @"20a88077-10d4-4648-92cb-7dc7ba5b8df5");
        var swimlaneToUpdate = swimlaneFromTable.Value;

        var convertedSwimlaneToUpdate = new SwimlanePatchRequest
        {
            Title = swimlaneToUpdate.Title,
            Order = swimlaneToUpdate.SwimlaneOrder
        };

        swimlanePatchRequest.ApplyTo (convertedSwimlaneToUpdate); //Could add a ModelState validation somewhere here as well..

        swimlaneToUpdate.Title = convertedSwimlaneToUpdate.Title;
        swimlaneToUpdate.SwimlaneOrder = convertedSwimlaneToUpdate.Order;

        var response = await _swimlaneTable.UpdateEntityAsync (swimlaneToUpdate, Azure.ETag.All);
        if (response.IsError)
        {
            return BadRequest ($"Could not update card. Internal status: {response.Status}");
        }

        //Now we must update each card that refers to the swimlane. This should be a repository method called here.

        var swimlaneResponse = new ColumnResponse
        {
            ID = Guid.Parse (swimlaneToUpdate.PartitionKey),
            Title = swimlaneToUpdate.Title,
            BoardID = Guid.Parse (swimlaneToUpdate.RowKey),
            Order = swimlaneToUpdate.SwimlaneOrder
        };

        return Ok (swimlaneResponse);
    }

    [HttpDelete ("delete/{ID:Guid}")]
    public async Task<ActionResult> DeleteSwimlane (Guid ID)
    {
        var swimlaneList = new List<Swimlane> ();
        var swimlanesFromTable = _swimlaneTable.QueryAsync<Swimlane> (column => column.PartitionKey == ID.ToString ());
        await foreach (var swimlane in swimlanesFromTable)
            swimlaneList.Add (swimlane);

        if (swimlaneList.Count () is 0)
            return NotFound ("The swimlane you are searching for was not found.");

        if (swimlaneList.Count () > 1)
            return StatusCode (StatusCodes.Status500InternalServerError, "Multiple sswimlanes were found with the same ID.");

        var swimlaneFromDatabase = swimlaneList.Single ();
        var swimlaneToDelete = _swimlaneTable.DeleteEntityAsync (swimlaneFromDatabase.PartitionKey, swimlaneFromDatabase.RowKey);

        //Iterate on cards in the newest deleted swimlane and move it to the next swimlane. This should be a method called in the repository...

        if (swimlaneToDelete.IsCompletedSuccessfully)
            return Ok (); //Is there a better Status to return? NoContent perhaps?
        else
            return StatusCode (StatusCodes.Status500InternalServerError, "Could not delete column.");
    }
}