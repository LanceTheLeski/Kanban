using ArcStrides.API.Options;
using Azure.Data.Tables;
using Microsoft.Extensions.Options;
using System.Reflection;

namespace ArcStrides.API.Services;

/// <summary>
/// Creates the tables the API reads and writes, when they are not there already.
///
/// AzureTableService goes straight to TableClient without ever calling
/// CreateIfNotExists, which is fine against the real storage account — the tables
/// were made by hand once — but leaves a freshly started Azurite instance empty, so
/// every request fails with TableNotFound.
///
/// Program.cs runs this at startup in Development only. Against a storage account
/// whose tables already exist it is a no-op, so it is safe either way; it is scoped
/// to Development regardless, because creating tables is not something a deployed
/// app should decide to do on boot.
/// </summary>
public static class ArcTableProvisioner
{
    /// <summary>
    /// Every table name declared by an [ArcTableName] entity in this assembly.
    ///
    /// Read from the attributes rather than listed here, so an entity added later
    /// is provisioned without anyone remembering to update a second list.
    /// </summary>
    public static IReadOnlyCollection<string> DiscoverTableNames ()
        => Assembly.GetExecutingAssembly ()
                   .GetTypes ()
                   .Select (entityType => entityType.GetArcTableName ())
                   .Where (tableName => string.IsNullOrWhiteSpace (tableName) is false)
                   .Select (tableName => tableName!)
                   .Distinct ()
                   .OrderBy (tableName => tableName)
                   .ToList ();

    public static async Task EnsureArcTablesExistAsync (this IServiceProvider services, ILogger logger)
    {
        var azureTableOptions = services.GetRequiredService<IOptions<AzureTableOptions>> ();
        var tableNames = DiscoverTableNames ();

        try
        {
            var tableServiceClient = new TableServiceClient (azureTableOptions.Value.ServiceEndpoint);

            foreach (var tableName in tableNames)
                await tableServiceClient.CreateTableIfNotExistsAsync (tableName);

            logger.LogInformation ("Storage ready. {TableCount} Arc tables checked: {TableNames}",
                                   tableNames.Count,
                                   string.Join (", ", tableNames));
        }
        catch (Exception ex)
        {
            // Deliberately not fatal. A developer who has not started Azurite yet
            // should get a readable explanation and a running API, not a stack trace
            // at boot with the real cause buried in it.
            logger.LogWarning (ex,
                               "Could not reach table storage, so the Arc tables were not checked. "
                               + "If you are developing against the emulator, start it with `azurite --silent` "
                               + "and restart the API. See docs/local-development.md.");
        }
    }
}
