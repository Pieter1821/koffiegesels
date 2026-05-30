using Koffiegesels.Api.Data;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Threading.RateLimiting;

namespace Koffiegesels.Api.Shared.Guardrails;

public static class GuardrailsExtensions
{
    public const string ChatRateLimitPolicy = "chat";

    public static IHostApplicationBuilder AddKoffiegeselsGuardrails(this IHostApplicationBuilder builder)
    {
        builder.Services.AddOptions<GuardrailsOptions>()
                        .Bind(builder.Configuration.GetSection(GuardrailsOptions.SectionName))
                        .ValidateDataAnnotations()
                        .ValidateOnStart();

        builder.Services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.AddPolicy(ChatRateLimitPolicy, httpContext =>
            {
                var guardrails = httpContext.RequestServices
                    .GetRequiredService<IOptions<GuardrailsOptions>>().Value;

                var partitionKey = httpContext.User.FindFirstValue("sub")
                    ?? httpContext.Connection.RemoteIpAddress?.ToString()
                    ?? "anonymous";

                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey,
                    _ => new FixedWindowRateLimiterOptions
                    {
                        AutoReplenishment = true,
                        PermitLimit = guardrails.RequestsPerMinute,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                    });
            });
        });

        return builder;
    }
}

/// <summary>Shared pre-flight checks for send/stream AI endpoints.</summary>
public static class AiRequestGuards
{
    public static IResult? RejectUnsafeContent(string content)
    {
        if (ContentSafety.TryValidate(content, out var reason))
        {
            return null;
        }

        return Results.Problem(
            title: "Boodskap geweier",
            detail: reason,
            statusCode: StatusCodes.Status400BadRequest);
    }

    public static async Task<IResult?> RejectOverDailyCapAsync(
        KoffiegeselsContext dbContext,
        string userId,
        GuardrailsOptions guardrails,
        CancellationToken cancellationToken)
    {
        var usage = await UserUsageLimits.GetDailyTokenUsageAsync(dbContext, userId, cancellationToken);
        if (!UserUsageLimits.IsOverDailyCap(usage, guardrails.DailyTokenCap))
        {
            return null;
        }

        return Results.Problem(
            title: "Daaglikse limiet bereik",
            detail: "Jy het vandag se token-limiet bereik. Probeer môre weer.",
            statusCode: StatusCodes.Status429TooManyRequests);
    }
}
