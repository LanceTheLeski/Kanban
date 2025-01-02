using ArcStrides.Contracts.Request.Create;
using ArcStrides.Contracts.Response;
using ArcStrides.UI.Components.ArcErrorHandler;
using ArcStrides.UI.Options;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Net.Http.Headers;

namespace ArcStrides.UI.Services;

public class CardService : ICardService
{
    private readonly HttpClient _httpClient;

    private readonly BackendOptions _backendOptions;

    private readonly IArcErrorHandler _arcErrorHandler;

    public CardService(IHttpClientFactory httpClientFactory,
                       IOptions<BackendOptions> backendOptions,
                       IArcErrorHandler arcErrorHandler)
    {
        _httpClient = httpClientFactory.CreateClient();

        _backendOptions = backendOptions.Value;

        _arcErrorHandler = arcErrorHandler;
    }

    public async Task<BoardCardResponse?> CreateCard (CardCreateRequest boardCardCreateRequest)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Post, @$"{_backendOptions.URL}arcstrides/cards");
        httpRequestMessage.Content = new StringContent (JsonConvert.SerializeObject(boardCardCreateRequest), mediaType: new MediaTypeHeaderValue (@"application/json"));

        var response = await _httpClient.SendAsync (httpRequestMessage);
        if (response.IsSuccessStatusCode is false)
        {
            _arcErrorHandler.AddError (response.ReasonPhrase ?? string.Empty, response.StatusCode);
            return null;
        }

        var responseBody = await response.Content.ReadAsStringAsync ();
        var boardCardResponse = JsonConvert.DeserializeObject<BoardCardResponse> (responseBody);
        return boardCardResponse;
    }

    public async Task<BoardCardResponse?> UpdateCard (Guid cardID, string boardCardPatchRequest)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Patch, @$"{_backendOptions.URL}arcstrides/cards/{cardID}");
        httpRequestMessage.Content = new StringContent (boardCardPatchRequest, mediaType: new MediaTypeHeaderValue (@"application/json"));

        var response = await _httpClient.SendAsync (httpRequestMessage);
        if (response.IsSuccessStatusCode is false)
        {
            _arcErrorHandler.AddError (response.ReasonPhrase, response.StatusCode);
            return null;
        }

        var responseBody = await response.Content.ReadAsStringAsync ();
        var boardCardResponse = JsonConvert.DeserializeObject<BoardCardResponse> (responseBody);
        return boardCardResponse!;
    }

    public async Task<bool> DeleteCard (Guid cardID)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Delete, @$"{_backendOptions.URL}arcstrides/boards/{cardID}");

        var response = await _httpClient.SendAsync (httpRequestMessage);
        if (response.IsSuccessStatusCode is false)
        {
            _arcErrorHandler.AddError (response.ReasonPhrase, response.StatusCode);
            return false;
        }

        return true;
    }
}