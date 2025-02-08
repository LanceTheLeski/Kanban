using ArcStrides.UI.Components.ArcErrorHandler;
using ArcStrides.UI.Options;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Net.Http.Headers;

namespace ArcStrides.UI.Services;

public class ArcStridesService<TResp> : IArcStridesService<TResp> where TResp : class, new ()
{
    private readonly HttpClient _httpClient;

    private readonly ArcStridesServiceOptions _backendOptions;

    private readonly IArcErrorHandler _arcErrorHandler;

    public ArcStridesService (IHttpClientFactory httpClientFactory,
                              IOptions<ArcStridesServiceOptions> backendOptions,
                              IArcErrorHandler arcErrorHandler)
    {
        _httpClient = httpClientFactory.CreateClient ();

        _backendOptions = backendOptions.Value;

        _arcErrorHandler = arcErrorHandler;
    }

    public async Task<TResp?> FetchEntityAsync (string urlPath)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Post, $"{_backendOptions.URL.TrimEnd ('/')}/{urlPath}");

        var response = await _httpClient.SendAsync (httpRequestMessage);
        if (response.IsSuccessStatusCode is false)
        {
            _arcErrorHandler.AddError (response.ReasonPhrase ?? string.Empty, response.StatusCode);
            return null;
        }

        var responseBody = await response.Content.ReadAsStringAsync ();
        var entityResponse = JsonConvert.DeserializeObject<TResp> (responseBody);
        return entityResponse;
    }

    public async Task<TResp?> CreateEntityAsync (string urlPath, string serializedEntityCreateRequest)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Post, $"{_backendOptions.URL.TrimEnd ('/')}/{urlPath}");
        httpRequestMessage.Content = new StringContent (serializedEntityCreateRequest, mediaType: new MediaTypeHeaderValue (@"application/json"));

        var response = await _httpClient.SendAsync (httpRequestMessage);
        if (response.IsSuccessStatusCode is false)
        {
            _arcErrorHandler.AddError (response.ReasonPhrase ?? string.Empty, response.StatusCode);
            return null;
        }

        var responseBody = await response.Content.ReadAsStringAsync ();
        var entityResponse = JsonConvert.DeserializeObject<TResp> (responseBody);
        return entityResponse;
    }

    public async Task<TResp?> UpdateEntityAsync (string urlPath, string serializedEntityPatchRequest)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Patch, $"{_backendOptions.URL.TrimEnd ('/')}/{urlPath}");
        httpRequestMessage.Content = new StringContent (serializedEntityPatchRequest, mediaType: new MediaTypeHeaderValue (@"application/json"));

        var response = await _httpClient.SendAsync (httpRequestMessage);
        if (response.IsSuccessStatusCode is false)
        {
            var responseBodyy = await response.Content.ReadAsStringAsync ();

            _arcErrorHandler.AddError (response.ReasonPhrase ?? string.Empty, response.StatusCode);
            return null;
        }

        var responseBody = await response.Content.ReadAsStringAsync ();
        var entityResponse = JsonConvert.DeserializeObject<TResp> (responseBody);
        return entityResponse;
    }

    public async Task DeleteEntityAsync (string urlPath)
    {
        var httpRequestMessage = new HttpRequestMessage (HttpMethod.Delete, $"{_backendOptions.URL.TrimEnd ('/')}/{urlPath}");

        var response = await _httpClient.SendAsync (httpRequestMessage);
        if (response.IsSuccessStatusCode is false)
        {
            _arcErrorHandler.AddError (response.ReasonPhrase ?? string.Empty, response.StatusCode);
        }
    }
}