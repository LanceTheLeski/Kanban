using ArcStrides.API.Models;
using ArcStrides.API.Options;
using ArcStrides.API.Services;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Repositories;

public class TimelineRepository : AzureTableService<Timeline>, ITimelineRepository
{
    private const string timelines = "Timelines";

    private readonly ICardRepository _cardRepository;
    private readonly ITaskRepository _taskRepository;

    public TimelineRepository (IOptions<AzureTableOptions> cosmosOptions,
                               ICardRepository cardRepository,
                               ITaskRepository taskRepository)
        : base (timelines, cosmosOptions)
    { 
        _cardRepository = cardRepository;
        _taskRepository = taskRepository;
    }

    public async Task<Timeline?> GetTimelineAsync (Guid timelineID, Guid parentID)
        => await GetEntityAsync (timelineID, parentID);

    public async Task AddTimelineAsync (Timeline timelineToAdd)
        => await AddEntityAsync (timelineToAdd);

    public async Task UpdateTimelineAsync (Timeline timelineToUpdate)
        => await UpdateEntityAsync (timelineToUpdate);

    public async Task DeleteTimelineAsync (Timeline timelineToDelete)
        => await DeleteEntityAsync (timelineToDelete);

    public async Task<Collection<Timeline>> QueryTimelinesAsync (Expression<Func<Timeline, bool>> timelineQueryExpression)
        => await QueryEntitiesAsync (timelineQueryExpression);

    public async Task<bool> ParentExistsAsync (Guid parentID, int timelineTypeID)
    {
        switch (timelineTypeID)
        {
            case 1:// Card
                var cardCollection = await _cardRepository.GetCardsAsync (parentID);
                return cardCollection?.Count () is 0;

            case 2:// Task
                var taskCollection = await _taskRepository.GetTasksAsync (parentID);
                return taskCollection?.Count () is 0;

            default:
                return false;
        }
    }
}