using Azure.Core;
using Microsoft.EntityFrameworkCore;

namespace Koffiegesels.Api.Data;

public static class DataExtensions
{
    public static WebApplicationBuilder AddKoffiegeselsNpgsql<TContext>(
        this WebApplicationBuilder builder,
        string connectionStringName,
        TokenCredential credential
    ) where TContext : DbContext
    {
        if (builder.Environment.IsProduction())
        {
            builder.AddAzureNpgsqlDbContext<TContext>(
                connectionStringName,
                settings => settings.Credential = credential);
        }
        else
        {
            builder.AddNpgsqlDbContext<TContext>(connectionStringName);
        }

        return builder;
    }

    public static async Task MigrateDbAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<KoffiegeselsContext>();
        await dbContext.Database.MigrateAsync();
    }
}
