﻿using Azure.Data.Tables;
using Kanban.Components.DTOs;
using Kanban.Contexts;
using Kanban.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Kanban.Controllers;

[ApiController]
[Route ("kanban/boards")]
public class BoardController : Controller
{
    private const string boards = "Boards";
    private const string columns = "Columns";
    private const string swimlanes = "Swimlanes";
    private const string cards = "Cards";
    private const string tags = "Tags";

    private readonly TableServiceClient _tableServiceClient;
    private readonly TableClient _boardTable;
    private readonly TableClient _columnTable;
    private readonly TableClient _swimlaneTable;
    private readonly TableClient _cardTable;
    private readonly TableClient _tagTable;

    public BoardController (IOptions<CosmosOptions> cosmosOptions)
    {
        _tableServiceClient = new TableServiceClient (cosmosOptions.Value.HonuBoards);
        _boardTable = _tableServiceClient.GetTableClient (tableName: boards);
        _columnTable = _tableServiceClient.GetTableClient (tableName: columns);
        _swimlaneTable = _tableServiceClient.GetTableClient (tableName: swimlanes);
        _cardTable = _tableServiceClient.GetTableClient (tableName: cards);
        _tagTable = _tableServiceClient.GetTableClient (tableName: tags);
    }

    [HttpGet ("fetch/{ID:guid}")]
    public async Task<ActionResult> FetchBoard (Guid ID)
    {
        var boardList = new List<Board> ();
        var boardsFromTable = _boardTable.QueryAsync<Board> (board => board.PartitionKey == ID.ToString ());
        await foreach (var board in boardsFromTable) 
            boardList.Add (board);

        var columnList = new List<Column> ();
        var columnsFromTable = _columnTable.QueryAsync<Column> (column => column.RowKey == ID.ToString ());
        await foreach (var column in columnsFromTable)
            columnList.Add (column);
        var columnListOrdered = columnList
            .OrderBy (column => column.ColumnOrder)
            .Select (column => (column.Title, column.PartitionKey, column.ColumnOrder));

        var swimlaneList = new List<Swimlane> ();
        var swimlanesFromTable = _swimlaneTable.QueryAsync<Swimlane> (swimlane => swimlane.RowKey == ID.ToString ());
        await foreach (var swimlane in swimlanesFromTable)
            swimlaneList.Add (swimlane);
        var swimlaneListOrdered = swimlaneList
            .OrderBy (swimlane => swimlane.SwimlaneOrder)
            .Select (swimlane => (swimlane.Title, swimlane.PartitionKey, swimlane.SwimlaneOrder));

        var boardResponse = new BoardResponse ();
        foreach (var column in columnListOrdered)
        {
            var swimlanes = new List<BoardResponse.BasicSwimlane> ();
            foreach (var swimlane in swimlaneListOrdered)
            {
                var cardList = boardList
                    .Where (board => board.ColumnID == Guid.Parse (column.PartitionKey) && board.SwimlaneID == Guid.Parse (swimlane.PartitionKey))
                    .Select (board => (board.CardTitle, board.CardDescription, board.RowKey));

                var cards = new List<BoardResponse.BasicCard> ();
                foreach (var card in cardList)
                {
                    cards.Add (new BoardResponse.BasicCard
                    {
                        ID = card.RowKey,
                        Title = card.CardTitle,
                        Description = card.CardDescription
                    });
                }

                swimlanes.Add (new BoardResponse.BasicSwimlane
                {
                    ID = swimlane.PartitionKey,
                    Title = swimlane.Title,
                    Order = swimlane.SwimlaneOrder,
                    Cards = cards
                });
            }

            boardResponse.Columns.Add (new BoardResponse.BasicColumn
            {
                ID = column.PartitionKey,
                Title = column.Title,
                Order = column.ColumnOrder,
                Swimlanes = swimlanes
            }); 
        }

        return Ok (boardResponse);
    }

    [HttpPost ("create")]
    public ActionResult CreateBoard ()
    {
        //todo

        //For later when we create in the table
        //await tableClient.AddEntityAsync<Product>(prod1);

        return StatusCode (StatusCodes.Status418ImATeapot);
    }

    [HttpPatch ("update/{IG:guid}")]
    public ActionResult UpdateBoard ()
    {
        //todo

        

        return StatusCode (StatusCodes.Status418ImATeapot);
    }
}