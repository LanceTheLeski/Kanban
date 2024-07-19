using Azure.Data.Tables;
using Kanban.Contracts.Request.Create;
using Kanban.Contracts.Request.Patch;
using Kanban.Contracts.Response;
using Kanban.API.Models;
using Kanban.API.Options;
using Kanban.API.Repositories;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.JsonPatch.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;

namespace Kanban.API.Controllers;

[ApiController]
[Route ("kanban/swimlanes")]
public class SwimlaneController : Controller //We should remove the SwimlaneOrder and SwimlaneTitle from the Board Table 
{
    private const string boards = "Boards";
    private const string swimlanes = "Swimlanes";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _boardTable;
    private readonly TableClient _swimlaneTable;

    private readonly IBoardRepository _boardRepository;
    private readonly ISwimlaneRepository _swimlaneRepository;

    public SwimlaneController (IOptions<CosmosOptions> cosmosOptions,
                               IBoardRepository boardRepository,
                               ISwimlaneRepository swimlaneRepository)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _boardTable = _tableServiceClient.GetTableClient (tableName: boards);
        _swimlaneTable = _tableServiceClient.GetTableClient (tableName: swimlanes);
        
        _boardRepository = boardRepository;
        _swimlaneRepository = swimlaneRepository;
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
            return NotFound ("The swimlane you are searching for was not found.");

        var swimlaneToReturn = swimlaneList.First ();
        var swimlaneResponse = new SwimlaneResponse
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

        var boardsFromTable = await _boardRepository.QueryBoardsAsync (board => board.PartitionKey == swimlaneCreateRequest.BoardID.ToString ());
        if (boardsFromTable.Count () is 0)
            return BadRequest ("The board ID passed in does not exist.");

        //if (swimlaneCreateRequest.Order > boardsFromTable.Count ())  //If equal then we're just going to add it to the end
        //    return BadRequest ("The order passed in is too high.");

        var newSwimlaneID = Guid.NewGuid ();
        var newSwimlane = new Swimlane
        {
            PartitionKey = newSwimlaneID.ToString (),
            RowKey = swimlaneCreateRequest.BoardID.ToString (),

            Title = swimlaneCreateRequest.Title,
            SwimlaneOrder = swimlaneCreateRequest.Order,

            BoardTitle = boardsFromTable.First ().Title
        };

        var addEntityResponse = await _swimlaneTable.AddEntityAsync (newSwimlane);
        if (addEntityResponse.IsError)
        {
            //We might want to have better verification later for failures. I'm thinking we actually query the table and grab the swimlane so we can map it to a response object
            return StatusCode (StatusCodes.Status500InternalServerError, $"Could not insert a new swimlane into database. Internal status: {addEntityResponse.Status}");
        }

        var swimlanesToUpdateOrder = await _swimlaneRepository.QuerySwimlanesAsync (swimlane => swimlane.SwimlaneOrder >= newSwimlane.SwimlaneOrder
                                                                                                && swimlane.RowKey == "20a88077-10d4-4648-92cb-7dc7ba5b8df5");
        var swimlaneJustAdded = swimlanesToUpdateOrder.FirstOrDefault (swimlane => swimlane.PartitionKey == newSwimlane.PartitionKey);
        if (swimlaneJustAdded is not null)
        {
            var swimlaneJustAddedIndex = swimlanesToUpdateOrder.IndexOf (swimlaneJustAdded);
            if (swimlaneJustAddedIndex is -1)
                return BadRequest ("Cannot find newly added swimlane");
            swimlanesToUpdateOrder.RemoveAt (swimlaneJustAddedIndex);
        }
        else
            return BadRequest ("The new swimlane was not added into the database.");

        foreach (var swimlane in swimlanesToUpdateOrder!)
            swimlane.SwimlaneOrder++;
        await _swimlaneRepository.UpdateSwimlaneBatchAndTheirBoardCardsAsync (swimlanesToUpdateOrder);

        var swimlaneResponse = new SwimlaneResponse
        {
            ID = Guid.Parse (newSwimlane.PartitionKey),
            Title = newSwimlane.Title,
            BoardID = Guid.Parse (newSwimlane.RowKey),
            Order = newSwimlane.SwimlaneOrder
        };
        return StatusCode (StatusCodes.Status201Created, swimlaneResponse);
    }

    [HttpPatch ("update/{ID:Guid}")]
    public async Task<ActionResult> UpdateSwimlane (Guid ID, [FromBody] JsonPatchDocument<SwimlanePatchRequest> swimlanePatchRequest)
    {
        if (swimlanePatchRequest is null)
            return BadRequest ("There was no Patch Request passed in!");

        Swimlane? swimlaneToUpdate = await _swimlaneRepository.GetSwimlaneAsync (swimlaneID: ID, boardID: new Guid (@"20a88077-10d4-4648-92cb-7dc7ba5b8df5"));
        if (swimlaneToUpdate is null)
            return NotFound ("Could not find the desired swimlane for update.");

        SwimlanePatchRequest? convertedSwimlaneToUpdate = null;
        try
        {
            convertedSwimlaneToUpdate = _swimlaneRepository.ApplyJsonPatchDocumentToSwimlane (swimlanePatchRequest, swimlaneToUpdate);
        }
        catch (JsonPatchException jsonPatchEx)
        {
            return BadRequest ($"The patch request is invalid. Problem(s): {jsonPatchEx.Message}");//This should get a unit and/or integration test
        }

        var swimlaneOrderChange = _swimlaneRepository.GetSwimlaneOrderChange (swimlaneToUpdate, convertedSwimlaneToUpdate!);

        Collection<Swimlane>? otherSwimlanesWithUpdatedOrder = null;
        if (swimlanePatchRequest.Operations.Any (operation => string.Equals (operation.path, $"/{nameof (SwimlanePatchRequest.Order)}", StringComparison.OrdinalIgnoreCase)))
        {
            var swimlaneCollection = await _swimlaneRepository.GetAllSwimlanesForBoard (boardID: Guid.Parse ("20a88077-10d4-4648-92cb-7dc7ba5b8df5"));
            try
            {
                otherSwimlanesWithUpdatedOrder = _swimlaneRepository.ApplyAllOtherSwimlaneOrdersAsync (swimlaneCollection, swimlaneOrderChange.oldOrder, swimlaneOrderChange.newOrder);
            }
            catch (Exception ex)
            {
                return BadRequest (ex);
            }
        }

        swimlaneToUpdate.Title = convertedSwimlaneToUpdate.Title;
        swimlaneToUpdate.SwimlaneOrder = convertedSwimlaneToUpdate.Order;

        if (otherSwimlanesWithUpdatedOrder is not null)
            otherSwimlanesWithUpdatedOrder.Add (swimlaneToUpdate);
        var allUpdatedSwimlanes = otherSwimlanesWithUpdatedOrder ?? new Collection<Swimlane> { swimlaneToUpdate };
        await _swimlaneRepository.UpdateSwimlaneBatchAndTheirBoardCardsAsync (allUpdatedSwimlanes);

        var swimlaneResponse = new SwimlaneResponse
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
        var swimlaneCollection = await _swimlaneRepository.QuerySwimlanesAsync (swimlane => swimlane.PartitionKey == ID.ToString ());

        if (swimlaneCollection.Count () is 0)
            return NotFound ("The swimlane you are searching for was not found.");
        if (swimlaneCollection.Count () > 1)
            return StatusCode (StatusCodes.Status500InternalServerError, "Multiple swimlanes were found with the same ID.");

        var swimlaneFromDatabase = swimlaneCollection.Single ();
        var swimlaneToDeleteResponse = await _swimlaneTable.DeleteEntityAsync (swimlaneFromDatabase.PartitionKey, swimlaneFromDatabase.RowKey);

        var swimlanesToUpdateOrder = await _swimlaneRepository.QuerySwimlanesAsync (swimlane => swimlane.SwimlaneOrder > swimlaneFromDatabase.SwimlaneOrder
                                                                                                && swimlane.RowKey == "20a88077-10d4-4648-92cb-7dc7ba5b8df5");
        foreach (var swimlane in swimlanesToUpdateOrder!)
            swimlane.SwimlaneOrder --;
        await _swimlaneRepository.UpdateSwimlaneBatchAndTheirBoardCardsAsync (swimlanesToUpdateOrder);

        var swimlaneToTransferCandidates = await _swimlaneRepository.QuerySwimlanesAsync (swimlane => swimlane.RowKey == "20a88077-10d4-4648-92cb-7dc7ba5b8df5"
                                                                                                      && (swimlane.SwimlaneOrder == swimlaneFromDatabase.SwimlaneOrder
                                                                                                          || swimlane.SwimlaneOrder == swimlaneFromDatabase.SwimlaneOrder - 1));
        var swimlaneToTransfer = swimlaneToTransferCandidates.Count is 2 ?
            swimlaneToTransferCandidates.MaxBy (swimlane => swimlane.SwimlaneOrder) :
            swimlaneToTransferCandidates.Single ();
        await _swimlaneRepository.UpdateSwimlaneToDeleteBordCardBatchAsync (swimlaneFromDatabase, swimlaneToTransfer!);

        if (!swimlaneToDeleteResponse.IsError)
            return Ok (); //Is there a better Status to return? NoContent perhaps?
        else
            return StatusCode (StatusCodes.Status500InternalServerError, "Could not delete swimlane.");
    }
}