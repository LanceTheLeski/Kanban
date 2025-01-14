namespace ArcStrides.UI.Services;

public interface IArcStridesService<TResp> where TResp : class, new()
{
    Task<TResp?> CreateEntityAsync (string url, string entityCreateRequestSerialized);

    Task<TResp?> UpdateEntityAsync (string url, string entityPatchRequestSerialized);

    Task DeleteEntityAsync (string url);
}