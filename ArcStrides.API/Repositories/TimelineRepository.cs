using ArcStrides.API.Models.Board;
using ArcStrides.API.Options;
using ArcStrides.API.Services;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Repositories;

public class TimelineRepository : ITimelineRepository
{
    private const string timelines = "Timelines";

    private readonly ICardRepository _cardRepository;
    private readonly ITaskRepository _taskRepository;

    private readonly IAzureTableService<Timeline> _timelineTable;

    public TimelineRepository (IOptions<AzureTableOptions> azureTableOptions,
                               ICardRepository cardRepository,
                               ITaskRepository taskRepository)
    { 
        _cardRepository = cardRepository;
        _taskRepository = taskRepository;

        _timelineTable = new AzureTableService<Timeline> (timelines, azureTableOptions);
    }

    public async Task<Timeline?> GetTimelineAsync (Guid boardID, Guid timelineID)
        => await _timelineTable.GetEntityAsync (boardID, timelineID);

    public async Task AddTimelineAsync (Timeline timelineToAdd)
        => await _timelineTable.AddEntityAsync (timelineToAdd);

    public async Task UpdateTimelineAsync (Timeline timelineToUpdate)
        => await _timelineTable.UpdateEntityAsync (timelineToUpdate);

    public async Task DeleteTimelineAsync (Timeline timelineToDelete)
        => await _timelineTable.DeleteEntityAsync (timelineToDelete);

    public async Task<Collection<Timeline>> QueryTimelinesAsync (Expression<Func<Timeline, bool>> timelineQueryExpression)
        => await _timelineTable.QueryEntitiesAsync (timelineQueryExpression);

    public async Task<bool> ParentExistsAsync (Guid boardID, Guid parentID, int timelineTypeID)
    {
        switch (timelineTypeID)
        {
            case 1:// Card
                var cardMatch = await _cardRepository.GetCardAsync (boardID, parentID);
                return cardMatch is not null;

            case 2:// Task
                var taskMatch = await _taskRepository.GetTaskAsync (boardID, parentID);
                return taskMatch is not null;

            default:
                return false;
        }
    }
}