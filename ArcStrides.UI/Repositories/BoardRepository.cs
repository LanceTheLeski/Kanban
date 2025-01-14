using ArcStrides.Contracts.Response;
using ArcStrides.UI.Components.ArcErrorHandler;
using ArcStrides.UI.Options;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace ArcStrides.UI.Repositories;

public class BoardRepository : IBoardRepository
{
    private readonly HttpClient _httpClient;
    private readonly ArcStridesServiceOptions _backendOptions;
    private readonly IArcErrorHandler _arcErrorHandler;

    public BoardRepository (IHttpClientFactory httpClientFactory,
                         IOptions<ArcStridesServiceOptions> backendOptions,
                         IArcErrorHandler arcErrorHandler)
    {
        _httpClient = httpClientFactory.CreateClient ();
        _backendOptions = backendOptions.Value;
        _arcErrorHandler = arcErrorHandler;
    }

    public async Task<BoardResponse> FetchBoard (Guid boardID)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Get, @$"{_backendOptions.URL}arcstrides/boards/{boardID}");

        var response = await _httpClient.SendAsync (httpRequestMessage);
        if (response.IsSuccessStatusCode is false)
        {
            _arcErrorHandler.AddError (response.ReasonPhrase, response.StatusCode);
            return null;
        }

        var responseBody = await response.Content.ReadAsStringAsync ();
        var boardResponse = JsonConvert.DeserializeObject<BoardResponse> (responseBody);
        return boardResponse!;
    }
}