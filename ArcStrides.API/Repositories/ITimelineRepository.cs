using ArcStrides.API.Models.Board;
using System.Collections.ObjectModel;
using System.Linq.Expressions;

using Task = System.Threading.Tasks.Task;

namespace ArcStrides.API.Repositories;

public interface ITimelineRepository
{
    Task<Timeline?> GetTimelineAsync (Guid timelineID, Guid taskID);

    Task<Collection<Timeline>> QueryTimelinesAsync (Expression<Func<Timeline, bool>> timelineQueryExpression);

    Task AddTimelineAsync (Timeline timelineToCreate);

    Task UpdateTimelineAsync (Timeline timelineToUpdate);

    Task DeleteTimelineAsync (Timeline timelineToDelete);

    Task<bool> ParentExistsAsync (Guid parentID, int timelineTypeID);

}