using Koffiegesels.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Koffiegesels.Api.Shared.Guardrails;

public static class UserUsageLimits
{
    /// <summary>Sum of persisted <see cref="Features.Conversations.Message.TokenCount"/> for today (UTC).</summary>
    public static async Task<int> GetDailyTokenUsageAsync(
        KoffiegeselsContext dbContext,
        string userId,
        CancellationToken cancellationToken)
    {
        var dayStart = DateTimeOffset.UtcNow.Date;

        return await dbContext.Messages
            .AsNoTracking()
            .Where(m => m.CreatedAt >= dayStart && m.TokenCount != null)
            .Where(m => m.Conversation!.UserId == userId)
            .SumAsync(m => m.TokenCount ?? 0, cancellationToken);
    }

    public static bool IsOverDailyCap(int currentUsage, int cap) => currentUsage >= cap;

    /// <summary>Rough token estimate when the provider does not report usage (streaming).</summary>
    public static int EstimateTokens(string text) =>
        string.IsNullOrEmpty(text) ? 0 : Math.Max(1, text.Length / 4);
}
