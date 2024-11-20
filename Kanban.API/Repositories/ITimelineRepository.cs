using Kanban.API.Models;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public interface ITimelineRepository
{
    public Task<Timeline?> GetTimelineAsync (Guid timelineID, Guid taskID);

    public Task<Collection<Timeline>> QueryTimelinesAsync (Expression<Func<Timeline, bool>> timelineQueryExpression);

    public Task<Azure.Response> AddTimelineAsync (Timeline timelineToCreate);
}