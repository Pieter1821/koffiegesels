using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Koffiegesels.Api.Data;

/// <summary>
/// Lets <c>dotnet ef</c> run without starting the web host (Aspire, JWT validation, MigrateDbAsync).
/// Loads connection string from user-secrets or environment — same key as runtime: KoffiegeselsDB.
/// </summary>
public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<KoffiegeselsContext>
{
    public KoffiegeselsContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddUserSecrets<Program>(optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("KoffiegeselsDB")
            ?? throw new InvalidOperationException(
                "Connection string 'KoffiegeselsDB' not found. Set it via Aspire, user-secrets, or --connection on dotnet ef.");

        var options = new DbContextOptionsBuilder<KoffiegeselsContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new KoffiegeselsContext(options);
    }
}
