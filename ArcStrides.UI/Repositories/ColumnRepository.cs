using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Components.ArcErrorHandler;
using ArcStrides.UI.Services;
using Newtonsoft.Json;
using System.Net.Http.Headers;

namespace ArcStrides.UI.Repositories;

public class ColumnRepository : IColumnRepository
{
    private readonly IArcStridesService<ColumnResponse> _arcStridesBackend;

    private readonly IArcErrorHandler _arcErrorHandler;

    public ColumnRepository (IArcStridesService<ColumnResponse> arcStridesBackend, 
                             IArcErrorHandler arcErrorHandler)
    {
        _arcStridesBackend = arcStridesBackend;

        _arcErrorHandler = arcErrorHandler;
    }

    public async Task<ColumnResponse?> CreateColumnAsync (Guid boardID, ColumnCreateRequest columnCreateRequest)
        => await _arcStridesBackend.CreateEntityAsync (@$"arcstrides/boards/{boardID}/columns", JsonConvert.SerializeObject (columnCreateRequest));
    

    public async Task<ColumnResponse?> UpdateColumnAsync (Guid boardID, Guid columnID, string columnPatchRequest)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Patch, @$"{_backendOptions.URL}arcstrides/boards/{boardID}/columns/{columnID}");
        httpRequestMessage.Content = new StringContent (columnPatchRequest, mediaType: new MediaTypeHeaderValue (@"application/json"));

        var response = await _httpClient.SendAsync (httpRequestMessage);
        if (response.IsSuccessStatusCode is false)
        {
            _arcErrorHandler.AddError (response.ReasonPhrase ?? string.Empty, response.StatusCode);
            return null;
        }

        var responseBody = await response.Content.ReadAsStringAsync ();
        var columnResponse = JsonConvert.DeserializeObject<ColumnResponse> (responseBody);
        return columnResponse!;
    }

    public async Task<bool> DeleteColumnAsync (Guid boardID, Guid columnID)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Delete, @$"{_backendOptions.URL}arcstrides/boards/{boardID}/columns/{columnID}");

        var response = await _httpClient.SendAsync (httpRequestMessage);
        if (response.IsSuccessStatusCode is false)
        {
            _arcErrorHandler.AddError (response.ReasonPhrase ?? string.Empty, response.StatusCode);
            return false;
        }

        return true;
    }
}