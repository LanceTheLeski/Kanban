using ArcStrides.API.Models;
using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Request.Patch;
using ArcStrides.Contracts.Response;

namespace ArcStrides.API.Calendars.Mappers;

public interface IDateMapper
{
    Date MapDateCreateRequestToDate (DateCreateRequest dateCreateRequest);

    Date MapDatePatchRequestToDate (DatePatchRequest datePatchRequest);

    DateResponse MapDateToDateResponse (Date date);
}