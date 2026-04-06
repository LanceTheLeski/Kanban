using ArcStrides.Func.Sync.Options;
using ArcStrides.Func.Sync.Services;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var host = new HostBuilder()
    .ConfigureFunctionsWorkerDefaults()
    .ConfigureServices((ctx, services) =>
    {
        services.Configure<GoogleDriveOptions>(ctx.Configuration.GetSection("GoogleDrive"));
        services.Configure<SyncOptions>(ctx.Configuration.GetSection("Sync"));
        services.AddSingleton<IGoogleDriveService, GoogleDriveService>();
    })
    .Build();

await host.RunAsync();
