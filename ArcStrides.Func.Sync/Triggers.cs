using Microsoft.Azure.WebJobs;
using Microsoft.Extensions.Logging;

namespace ArcStrides.Func.Sync;

public class Triggers
{
    [FunctionName("CloudSync")]
    public void Run([TimerTrigger("0 */5 * * * *")]TimerInfo timerTrigger, ILogger logger)
    {
        
    }
}