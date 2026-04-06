namespace ArcStrides.Func.Sync.Options;

public class SyncOptions
{
    public string LocalOutputPath        { get; set; } = string.Empty;
    public int    MaxConcurrentDownloads { get; set; } = 4;
}
