using Kanban.API.Helpers;
using Kanban.API.Models;
using Kanban.API.Options;
using Microsoft.Extensions.Options;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public class TimelineRepository : EntityRepository<Timeline>, ITimelineRepository
{
    private const string timelines = "Timelines";

    public TimelineRepository (IOptions<CosmosOptions> cosmosOptions)
        : base (timelines, cosmosOptions)
    { }

    public async Task<Timeline?> GetTimelineAsync (Guid timelineID, Guid parentID)
        => await GetEntityAsync (timelineID, parentID);

    public async Task<Azure.Response> AddTimelineAsync (Timeline timelineToAdd)
        => await AddEntityAsync (timelineToAdd);

    public async Task<Collection<Timeline>> QueryTimelinesAsync (Expression<Func<Timeline, bool>> timelineQueryExpression)
        => await QueryEntitiesAsync (timelineQueryExpression);
}