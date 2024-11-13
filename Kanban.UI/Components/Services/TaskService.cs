using Kanban.Contracts.Request.Create;
using Kanban.Contracts.Response;
using Kanban.UI.Options;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Net.Http.Headers;

namespace Kanban.UI.Components.Services;

public class TaskService : ITaskService
{
    private readonly HttpClient _httpClient;
    private readonly BackendOptions _backendOptions;
    private readonly IKanbanErrorHandler _kanbanErrorHandler;

    public TaskService (IHttpClientFactory httpClientFactory,
                        IOptions<BackendOptions> backendOptions,
                        IKanbanErrorHandler kanbanErrorHandler)
    {
        _httpClient = httpClientFactory.CreateClient ();
        _backendOptions = backendOptions.Value;
        _kanbanErrorHandler = kanbanErrorHandler;
    }

    public async Task<TaskResponse?> CreateTaskAsync (TaskCreateRequest taskCreateRequest)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Post, @$"{_backendOptions.URL}kanban/tasks/create");
        httpRequestMessage.Content = new StringContent (JsonConvert.SerializeObject (taskCreateRequest), mediaType: new MediaTypeHeaderValue (@"application/json"));

        var response = await _httpClient.SendAsync (httpRequestMessage);

        if (response.IsSuccessStatusCode)
        {
            _kanbanErrorHandler.AddError (response.ReasonPhrase, response.StatusCode);
            return null;
        }

        var responseBody = await response.Content.ReadAsStringAsync ();
        var taskResponse = JsonConvert.DeserializeObject<TaskResponse> (responseBody);

        return taskResponse;
    }
}