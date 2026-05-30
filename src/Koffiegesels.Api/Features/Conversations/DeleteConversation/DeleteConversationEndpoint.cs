using Koffiegesels.Api.Data;
using Koffiegesels.Api.Shared.Dev;
using Microsoft.EntityFrameworkCore;

namespace Koffiegesels.Api.Features.Conversations.DeleteConversation;

public static class DeleteConversationEndpoint
{
    public static void MapDeleteConversation(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/{id:guid}", async (
            Guid id,
            KoffiegeselsContext dbContext,
            ICurrentUser currentUser,
            ILogger<Program> logger) =>
        {
            var deleted = await dbContext.Conversations
                .Where(c => c.Id == id && c.UserId == currentUser.UserId)
                .ExecuteDeleteAsync();

            if (deleted == 0)
            {
                return Results.NotFound();
            }

            logger.LogInformation(
                "Deleted conversation {ConversationId} for user {UserId}",
                id,
                currentUser.UserId);

            return Results.NoContent();
        })
        .Produces(StatusCodes.Status204NoContent)
        .Produces(StatusCodes.Status404NotFound);
    }
}
