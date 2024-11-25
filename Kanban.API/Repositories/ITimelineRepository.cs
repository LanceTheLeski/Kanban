using Kanban.API.Models;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

namespace Kanban.API.Repositories;

public interface ITimelineRepository
{
    Task<Timeline?> GetTimelineAsync (Guid timelineID, Guid taskID);

    Task<Collection<Timeline>> QueryTimelinesAsync (Expression<Func<Timeline, bool>> timelineQueryExpression);

    Task<Azure.Response> AddTimelineAsync (Timeline timelineToCreate);

    Task<Azure.Response> UpdateTimelineAsync (Timeline timelineToUpdate);

    Task<Azure.Response> DeleteTimelineAsync (Timeline timelineToDelete);

    Task<bool> ParentExistsAsync (Guid parentID, int timelineTypeID);

}