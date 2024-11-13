using Kanban.Contracts.Request.Create;
using Kanban.Contracts.Response;
using Kanban.UI.Options;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Net.Http.Headers;

namespace Kanban.UI.Components.Services;

public class CardService : ICardService
{
    private readonly HttpClient _httpClient;
    private readonly BackendOptions _backendOptions;
    private readonly IKanbanErrorHandler _kanbanErrorHandler;

    public CardService (IHttpClientFactory httpClientFactory,
                        IOptions<BackendOptions> backendOptions,
                        IKanbanErrorHandler kanbanErrorHandler)
    {
        _httpClient = httpClientFactory.CreateClient ();
        _backendOptions = backendOptions.Value;
        _kanbanErrorHandler = kanbanErrorHandler;
    }

    public async Task<BoardCardResponse?> CreateCard (CardCreateRequest boardCardCreateRequest)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Post, @$"{_backendOptions.URL}kanban/cards");
        httpRequestMessage.Content = new StringContent (JsonConvert.SerializeObject (boardCardCreateRequest), mediaType: new MediaTypeHeaderValue (@"application/json"));

        var response = await _httpClient.SendAsync (httpRequestMessage);

        if (response.IsSuccessStatusCode)
        {
            _kanbanErrorHandler.AddError (response.ReasonPhrase, response.StatusCode);
            return null;
        }

        var responseBody = await response.Content.ReadAsStringAsync ();
        var boardCardResponse = JsonConvert.DeserializeObject<BoardCardResponse> (responseBody);

        return boardCardResponse;
    }

    public async Task<BoardCardResponse?> UpdateCard (Guid cardID, string boardCardPatchRequest)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Patch, @$"{_backendOptions.URL}kanban/cards/{cardID}");
        httpRequestMessage.Content = new StringContent (boardCardPatchRequest, mediaType: new MediaTypeHeaderValue (@"application/json"));

        var response = await _httpClient.SendAsync (httpRequestMessage);

        if (response.IsSuccessStatusCode is false)
        {
            _kanbanErrorHandler.AddError (response.ReasonPhrase, response.StatusCode);
            return null;
        }

        var responseBody = await response.Content.ReadAsStringAsync ();
        var boardCardResponse = JsonConvert.DeserializeObject<BoardCardResponse> (responseBody);

        return boardCardResponse!;
    }

    public async Task<bool> DeleteCard (Guid cardID)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Delete, @$"{_backendOptions.URL}kanban/boards/{cardID}");

        var response = await _httpClient.SendAsync (httpRequestMessage);

        if (response.IsSuccessStatusCode is false)
        {
            _kanbanErrorHandler.AddError (response.ReasonPhrase, response.StatusCode);
            return false;
        }

        return true;
    }
}