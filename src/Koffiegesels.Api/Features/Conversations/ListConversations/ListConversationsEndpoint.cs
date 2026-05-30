using Koffiegesels.Api.Data;
using Koffiegesels.Api.Features.Conversations;
using Koffiegesels.Api.Shared.Authentication;
using Microsoft.EntityFrameworkCore;

namespace Koffiegesels.Api.Features.Conversations.ListConversations;

public static class ListConversationsEndpoint
{
    public static void MapListConversations(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", async (
            KoffiegeselsContext dbContext,
            ICurrentUser currentUser) =>
        {
            var conversations = await dbContext.Conversations
                .AsNoTracking()
                .Where(c => c.UserId == currentUser.UserId)
                .OrderByDescending(c => c.UpdatedAt)
                .Select(c => new ConversationSummaryDto(
                    c.Id,
                    c.Title,
                    c.CreatedAt,
                    c.UpdatedAt))
                .ToListAsync();

            return Results.Ok(conversations);
        })
        .Produces<IReadOnlyList<ConversationSummaryDto>>();
    }
}
