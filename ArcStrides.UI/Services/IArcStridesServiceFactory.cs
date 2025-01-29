namespace ArcStrides.UI.Services;

public interface IArcStridesServiceFactory<TResp> where TResp : class, new ()
{
    ArcStridesService<TResp> CreateArcStridesService ();
}