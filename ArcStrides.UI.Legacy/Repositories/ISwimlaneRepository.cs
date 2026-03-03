using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;

namespace ArcStrides.UI.Repositories;

public interface ISwimlaneRepository
{
    Task<SwimlaneResponse?> CreateSwimlaneAsync (Guid boardID, SwimlaneCreateRequest swimlaneCreateRequest);

    Task<SwimlaneResponse?> UpdateSwimlaneAsync (Guid boardID, Guid swimlaneID, string swimlanePatchRequest);

    Task DeleteSwimlaneAsync (Guid boardID, Guid swimlaneID);
}