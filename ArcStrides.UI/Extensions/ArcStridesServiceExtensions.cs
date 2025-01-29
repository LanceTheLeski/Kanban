using ArcStrides.UI.Components.ArcErrorHandler;
using ArcStrides.UI.Options;
using Microsoft.Extensions.Options;

namespace ArcStrides.UI.Services;

/// <summary>
/// 
/// </summary>
/// <typeparam name="TResp"></typeparam>
public class ArcStridesServiceExtensions<TResp> : IArcStridesServiceFactory<TResp> where TResp : class, new()
{
    private readonly IHttpClientFactory _httpClientFactory;

    private readonly IOptions<ArcStridesServiceOptions> _options;

    private readonly IArcErrorHandler _arcErrorHandler;

    public ArcStridesServiceExtensions (IServiceProvider services,
                                        IServiceScopeFactory scopeFactory, 
                                        IHttpClientFactory httpClientFactory,
                                        IOptions<ArcStridesServiceOptions> backendOptions
                                        /*IArcErrorHandler arcErrorHandler*/)
    {
        _httpClientFactory = httpClientFactory;

        _options = backendOptions;

        //_arcErrorHandler = arcErrorHandler;
    }

    /// <summary>
    /// 
    /// </summary>
    /// <returns></returns>
    public ArcStridesService<TResp> CreateArcStridesService ()
        => new (_httpClientFactory, _options, _arcErrorHandler);
}