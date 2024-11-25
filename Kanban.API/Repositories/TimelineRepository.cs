using Kanban.API.Components;
using Kanban.API.Models;
using Kanban.API.Options;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public class TimelineRepository : EntityRepository<Timeline>, ITimelineRepository
{
    private const string timelines = "Timelines";

    private readonly ICardRepository _cardRepository;
    private readonly ITaskRepository _taskRepository;

    public TimelineRepository (IOptions<CosmosOptions> cosmosOptions,
                               ICardRepository cardRepository,
                               ITaskRepository taskRepository)
        : base (timelines, cosmosOptions)
    { 
        _cardRepository = cardRepository;
        _taskRepository = taskRepository;
    }

    public async Task<Timeline?> GetTimelineAsync (Guid timelineID, Guid parentID)
        => await GetEntityAsync (timelineID, parentID);

    public async Task<Azure.Response> AddTimelineAsync (Timeline timelineToAdd)
        => await AddEntityAsync (timelineToAdd);

    public async Task<Azure.Response> UpdateTimelineAsync (Timeline timelineToUpdate)
        => await UpdateEntityAsync (timelineToUpdate);

    public async Task<Azure.Response> DeleteTimelineAsync (Timeline timelineToDelete)
        => await DeleteEntityAsync (timelineToDelete);

    public async Task<Collection<Timeline>> QueryTimelinesAsync (Expression<Func<Timeline, bool>> timelineQueryExpression)
        => await QueryEntitiesAsync (timelineQueryExpression);

    public async Task<bool> ParentExistsAsync (Guid parentID, int timelineTypeID)
    {
        switch (timelineTypeID)
        {
            case 1:// Card
                var cardCollection = await _cardRepository.QueryCardsAsync (card => card.PartitionKey == parentID.ToString ());
                return cardCollection?.Count () is 0;

            case 2:// Task
                var taskCollection = await _taskRepository.QueryTasksAsync (task => task.PartitionKey == parentID.ToString ());
                return taskCollection?.Count () is 0;

            default:
                return false;
        }
    }
}