using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Components.ArcErrorHandler;
using ArcStrides.UI.Options;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Net.Http.Headers;

namespace ArcStrides.UI.Services;

public class SwimlaneService
{
    private readonly HttpClient _httpClient;

    private readonly BackendOptions _backendOptions;

    private readonly IArcErrorHandler _arcErrorHandler;

    public SwimlaneService (IHttpClientFactory httpClientFactory,
                          IOptions<BackendOptions> backendOptions,
                          IArcErrorHandler arcErrorHandler)
    {
        _httpClient = httpClientFactory.CreateClient ();

        _backendOptions = backendOptions.Value;

        _arcErrorHandler = arcErrorHandler;
    }

    public async Task<SwimlaneResponse?> CreateSwimlane (Guid boardID, SwimlaneCreateRequest swimlaneCreateRequest)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Post, @$"{_backendOptions.URL}arcstrides/boards/{boardID}/swimlanes");
        httpRequestMessage.Content = new StringContent (JsonConvert.SerializeObject (swimlaneCreateRequest), mediaType: new MediaTypeHeaderValue (@"application/json"));

        var response = await _httpClient.SendAsync (httpRequestMessage);
        if (response.IsSuccessStatusCode is false)
        {
            _arcErrorHandler.AddError (response.ReasonPhrase ?? string.Empty, response.StatusCode);
            return null;
        }

        var responseBody = await response.Content.ReadAsStringAsync ();
        var swimlaneResponse = JsonConvert.DeserializeObject<SwimlaneResponse> (responseBody);
        return swimlaneResponse;
    }

    public async Task<SwimlaneResponse?> UpdateSwimlane (Guid boardID, Guid swimlaneID, string swimlanePatchRequest)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Patch, @$"{_backendOptions.URL}arcstrides/boards/{boardID}/swimlanes/{swimlaneID}");
        httpRequestMessage.Content = new StringContent (swimlanePatchRequest, mediaType: new MediaTypeHeaderValue (@"application/json"));

        var response = await _httpClient.SendAsync (httpRequestMessage);
        if (response.IsSuccessStatusCode is false)
        {
            _arcErrorHandler.AddError (response.ReasonPhrase ?? string.Empty, response.StatusCode);
            return null;
        }

        var responseBody = await response.Content.ReadAsStringAsync ();
        var swimlaneResponse = JsonConvert.DeserializeObject<SwimlaneResponse> (responseBody);
        return swimlaneResponse!;
    }

    public async Task<bool> DeleteSwimlane (Guid boardID, Guid swimlaneID)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Delete, @$"{_backendOptions.URL}arcstrides/boards/{boardID}/swimlanes/{swimlaneID}");

        var response = await _httpClient.SendAsync (httpRequestMessage);
        if (response.IsSuccessStatusCode is false)
        {
            _arcErrorHandler.AddError (response.ReasonPhrase ?? string.Empty, response.StatusCode);
            return false;
        }

        return true;
    }
}