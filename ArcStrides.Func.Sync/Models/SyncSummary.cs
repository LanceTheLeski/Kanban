namespace ArcStrides.Func.Sync.Models;

public class SyncSummary
{
    private int _totalDiscovered;
    private int _downloaded;
    private int _exported;
    private int _skippedTooLarge;
    private int _skippedUnsupported;
    private int _deletesForbidden;
    private int _failed;

    public int TotalDiscovered { get => _totalDiscovered; set => _totalDiscovered = value; }
    public int Downloaded { get => _downloaded; set => _downloaded = value; }
    public int Exported { get => _exported; set => _exported = value; }
    public int SkippedTooLarge { get => _skippedTooLarge; set => _skippedTooLarge = value; }
    public int SkippedUnsupported { get => _skippedUnsupported; set => _skippedUnsupported = value; }
    public int DeletesForbidden { get => _deletesForbidden; set => _deletesForbidden = value; }
    public int Failed { get => _failed; set => _failed = value; }
    public List<string> Errors { get; set; } = [];

    public void IncrementDownloaded()         
        => Interlocked.Increment(ref _downloaded);

    public void IncrementExported()           
        => Interlocked.Increment(ref _exported);

    public void IncrementSkippedTooLarge()    
        => Interlocked.Increment(ref _skippedTooLarge);

    public void IncrementSkippedUnsupported() 
        => Interlocked.Increment(ref _skippedUnsupported);

    public void IncrementDeletesForbidden()   
        => Interlocked.Increment(ref _deletesForbidden);

    public void IncrementFailed()             
        => Interlocked.Increment(ref _failed);
}
