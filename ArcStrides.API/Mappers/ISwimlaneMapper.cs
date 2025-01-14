using ArcStrides.API.Models.Board;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;

namespace ArcStrides.API.Mappers;

public interface ISwimlaneMapper
{
    Swimlane MapSwimlaneCreateRequestToSwimlane (SwimlaneCreateRequest swimlaneCreateRequest);

    Swimlane MapSwimlanePatchRequestToSwimlane (SwimlanePatchRequest swimlanePatchRequest);

    SwimlanePatchRequest MapSwimlaneToSwimlanePatchRequest (Swimlane swimlane);

    SwimlaneResponse MapSwimlaneToSwimlaneResponse (Swimlane swimlane);
}