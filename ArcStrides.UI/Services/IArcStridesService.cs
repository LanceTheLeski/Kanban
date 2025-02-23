namespace ArcStrides.UI.Services;

public interface IArcStridesService<TResp> where TResp : class, new()
{
    Task<TResp?> FetchEntityAsync (string urlPath);

    Task<List<TResp>> FetchEntitiesAsync (string urlPath);

    Task<TResp?> CreateEntityAsync (string urlPath, string entityCreateRequestSerialized);

    Task<TResp?> UpdateEntityAsync (string urlPath, string entityPatchRequestSerialized);

    Task DeleteEntityAsync (string urlPath);
}