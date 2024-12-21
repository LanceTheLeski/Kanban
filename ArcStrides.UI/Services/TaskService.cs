using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Components.ArcErrorHandler;
using ArcStrides.UI.Options;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Net.Http.Headers;

namespace ArcStrides.UI.Services;

public class TaskService : ITaskService
{
    private readonly HttpClient _httpClient;
    private readonly BackendOptions _backendOptions;
    private readonly IArcErrorHandler _ArcStridesErrorHandler;

    public TaskService(IHttpClientFactory httpClientFactory,
                       IOptions<BackendOptions> backendOptions,
                       IArcErrorHandler ArcStridesErrorHandler)
    {
        _httpClient = httpClientFactory.CreateClient();
        _backendOptions = backendOptions.Value;
        _ArcStridesErrorHandler = ArcStridesErrorHandler;
    }

    public async Task<TaskResponse?> CreateTaskAsync(TaskCreateRequest taskCreateRequest)
    {
        var httpRequestMessage = new HttpRequestMessage(HttpMethod.Post, @$"{_backendOptions.URL}ArcStrides/tasks/create");
        httpRequestMessage.Content = new StringContent(JsonConvert.SerializeObject(taskCreateRequest), mediaType: new MediaTypeHeaderValue(@"application/json"));

        var response = await _httpClient.SendAsync(httpRequestMessage);

        if (response.IsSuccessStatusCode)
        {
            _ArcStridesErrorHandler.AddError(response.ReasonPhrase, response.StatusCode);
            return null;
        }

        var responseBody = await response.Content.ReadAsStringAsync();
        var taskResponse = JsonConvert.DeserializeObject<TaskResponse>(responseBody);

        return taskResponse;
    }
}