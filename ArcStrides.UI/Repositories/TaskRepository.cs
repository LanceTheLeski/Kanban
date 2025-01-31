using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Components.ArcErrorHandler;
using ArcStrides.UI.Options;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Net.Http.Headers;

namespace ArcStrides.UI.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly HttpClient _httpClient;

    private readonly ArcStridesServiceOptions _backendOptions;

    private readonly IArcErrorHandler _arcErrorHandler;

    public TaskRepository (IHttpClientFactory httpClientFactory,
                           IOptions<ArcStridesServiceOptions> backendOptions,
                           IArcErrorHandler arcErrorHandler)
    {
        _httpClient = httpClientFactory.CreateClient ();

        _backendOptions = backendOptions.Value;

        _arcErrorHandler = arcErrorHandler;
    }

    public async Task<TaskResponse?> CreateTask (Guid cardID, TaskCreateRequest boardTaskCreateRequest)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Post, @$"{_backendOptions.URL}arcstrides/cards/{cardID}/tasks");
        httpRequestMessage.Content = new StringContent (JsonConvert.SerializeObject (boardTaskCreateRequest), mediaType: new MediaTypeHeaderValue (@"application/json"));

        var response = await _httpClient.SendAsync (httpRequestMessage);
        if (response.IsSuccessStatusCode is false)
        {
            _arcErrorHandler.AddError (response.ReasonPhrase ?? string.Empty, response.StatusCode);
            return null;
        }

        var responseBody = await response.Content.ReadAsStringAsync ();
        var boardTaskResponse = JsonConvert.DeserializeObject<TaskResponse> (responseBody);
        return boardTaskResponse;
    }

    public async Task<TaskResponse?> UpdateTask (Guid cardID, Guid taskID, string boardTaskPatchRequest)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Patch, @$"{_backendOptions.URL}arcstrides/cards/{cardID}/tasks/{taskID}");
        httpRequestMessage.Content = new StringContent (boardTaskPatchRequest, mediaType: new MediaTypeHeaderValue (@"application/json"));

        var response = await _httpClient.SendAsync (httpRequestMessage);
        if (response.IsSuccessStatusCode is false)
        {
            _arcErrorHandler.AddError (response.ReasonPhrase ?? string.Empty, response.StatusCode);
            return null;
        }

        var responseBody = await response.Content.ReadAsStringAsync ();
        var boardTaskResponse = JsonConvert.DeserializeObject<TaskResponse> (responseBody);
        return boardTaskResponse;
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