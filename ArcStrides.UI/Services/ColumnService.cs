using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Components.ArcErrorHandler;
using ArcStrides.UI.Options;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Net.Http.Headers;

namespace ArcStrides.UI.Services;

public class ColumnService
{
    private readonly HttpClient _httpClient;

    private readonly BackendOptions _backendOptions;

    private readonly IArcErrorHandler _arcErrorHandler;

    public ColumnService (IHttpClientFactory httpClientFactory,
                          IOptions<BackendOptions> backendOptions,
                          IArcErrorHandler arcErrorHandler)
    {
        _httpClient = httpClientFactory.CreateClient ();

        _backendOptions = backendOptions.Value;

        _arcErrorHandler = arcErrorHandler;
    }

    public async Task<ColumnResponse?> CreateColumn (Guid boardID, ColumnCreateRequest columnCreateRequest)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Post, @$"{_backendOptions.URL}arcstrides/boards/{boardID}/columns");
        httpRequestMessage.Content = new StringContent (JsonConvert.SerializeObject (columnCreateRequest), mediaType: new MediaTypeHeaderValue (@"application/json"));

        var response = await _httpClient.SendAsync (httpRequestMessage);
        if (response.IsSuccessStatusCode is false)
        {
            _arcErrorHandler.AddError (response.ReasonPhrase ?? string.Empty, response.StatusCode);
            return null;
        }

        var responseBody = await response.Content.ReadAsStringAsync ();
        var columnResponse = JsonConvert.DeserializeObject<ColumnResponse> (responseBody);
        return columnResponse;
    }

    public async Task<ColumnResponse?> UpdateColumn (Guid boardID, Guid columnID, string columnPatchRequest)
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

    public async Task<bool> DeleteColumn (Guid boardID, Guid columnID)
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