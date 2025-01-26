using ArcStrides.API.Models.Board;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;
using Riok.Mapperly.Abstractions;

namespace ArcStrides.API.Mappers;

[Mapper]
public partial class SwimlaneMapper : ISwimlaneMapper
{
    /// <summary>
    /// <see cref="SwimlaneCreateRequest"/> --> <see cref="Swimlane"/>
    /// </summary>
    [MapProperty (nameof (SwimlaneCreateRequest.Title), nameof (Swimlane.Title))]
    [MapProperty (nameof (SwimlaneCreateRequest.Order), nameof (Swimlane.SwimlaneOrder))]
    public partial Swimlane MapSwimlaneCreateRequestToSwimlane (SwimlaneCreateRequest swimlaneCreateRequest);

    /// <summary>
    /// <see cref="SwimlaneCreateRequest"/> --> <see cref="Swimlane"/>
    /// </summary>
    [MapProperty (nameof (SwimlanePatchRequest.Title), nameof (Swimlane.Title))]
    [MapProperty (nameof (SwimlanePatchRequest.Order), nameof (Swimlane.SwimlaneOrder))]
    public partial Swimlane MapSwimlanePatchRequestToSwimlane (SwimlanePatchRequest swimlanePatchRequest);

    /// <summary>
    /// <see cref="Swimlane"/> --> <see cref="SwimlaneCreateRequest"/>
    /// </summary>
    [MapProperty (nameof (Swimlane.Title), nameof (SwimlanePatchRequest.Title))]
    [MapProperty (nameof (Swimlane.SwimlaneOrder), nameof (SwimlanePatchRequest.Order))]
    public partial SwimlanePatchRequest MapSwimlaneToSwimlanePatchRequest (Swimlane swimlane);

    /// <summary>
    /// <see cref="Swimlane"/> --> <see cref="SwimlaneResponse"/>
    /// </summary>
    [MapProperty (nameof (Swimlane.RowKey), nameof (SwimlaneResponse.ID))]
    [MapProperty (nameof (Swimlane.PartitionKey), nameof (SwimlaneResponse.BoardID))]
    [MapProperty (nameof (Swimlane.Title), nameof (SwimlaneResponse.Title))]
    [MapProperty (nameof (Swimlane.SwimlaneOrder), nameof (SwimlaneResponse.Order))]
    public partial SwimlaneResponse MapSwimlaneToSwimlaneResponse (Swimlane swimlane);
}