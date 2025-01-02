using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Components.ArcErrorHandler;
using ArcStrides.UI.Options;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Net.Http.Headers;

namespace ArcStrides.UI.Services;

public class CalendarService
{
    private readonly HttpClient _httpClient;

    private readonly BackendOptions _backendOptions;

    private readonly IArcErrorHandler _arcErrorHandler;

    public CalendarService (IHttpClientFactory httpClientFactory,
                            IOptions<BackendOptions> backendOptions,
                            IArcErrorHandler arcErrorHandler)
    {
        _httpClient = httpClientFactory.CreateClient ();

        _backendOptions = backendOptions.Value;

        _arcErrorHandler = arcErrorHandler;
    }

    public async Task<MonthResponse?> FetchMonth (Guid monthID)
    {
        return default;
    }

    public async Task<MonthResponse?> CreateMonth ()
    {
        return default;
    }

    public async Task<DateResponse?> CreateDate (Guid monthID, DateCreateRequest dateCreateRequest)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Post, @$"{_backendOptions.URL}arcstrides/calendars/months/{monthID}/dates");
        httpRequestMessage.Content = new StringContent (JsonConvert.SerializeObject (dateCreateRequest), mediaType: new MediaTypeHeaderValue (@"application/json"));

        var response = await _httpClient.SendAsync (httpRequestMessage);
        if (response.IsSuccessStatusCode is false)
        {
            _arcErrorHandler.AddError (response.ReasonPhrase ?? string.Empty, response.StatusCode);
            return null;
        }

        var responseBody = await response.Content.ReadAsStringAsync ();
        var boardTaskResponse = JsonConvert.DeserializeObject<DateResponse> (responseBody);
        return boardTaskResponse;
    }

    public async Task<DateResponse?> UpdateDate (Guid monthID, Guid dateID, string datePatchRequest)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Patch, @$"{_backendOptions.URL}arcstrides/calendar/months/{monthID}/dates/{dateID}");
        httpRequestMessage.Content = new StringContent (datePatchRequest, mediaType: new MediaTypeHeaderValue (@"application/json"));

        var response = await _httpClient.SendAsync (httpRequestMessage);
        if (response.IsSuccessStatusCode is false)
        {
            _arcErrorHandler.AddError (response.ReasonPhrase ?? string.Empty, response.StatusCode);
            return null;
        }

        var responseBody = await response.Content.ReadAsStringAsync ();
        var dateResponse = JsonConvert.DeserializeObject<DateResponse> (responseBody);
        return dateResponse;
    }

    public async Task<bool> DeleteTask (Guid cardID, Guid taskID)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Delete, @$"{_backendOptions.URL}arcstrides/cards/{cardID}/tasks/{taskID}");

        var response = await _httpClient.SendAsync (httpRequestMessage);
        if (response.IsSuccessStatusCode is false)
        {
            _arcErrorHandler.AddError (response.ReasonPhrase ?? string.Empty, response.StatusCode);
            return false;
        }

        return true;
    }
}