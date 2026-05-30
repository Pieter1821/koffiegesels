using Koffiegesels.Api.Data;
using Koffiegesels.Api.Shared.Dev;
using Microsoft.EntityFrameworkCore;

namespace Koffiegesels.Api.Features.Conversations.GetConversation;

public static class GetConversationEndpoint
{
    public static void MapGetConversation(this IEndpointRouteBuilder app)
    {
        app.MapGet("/{id:guid}", async (
            Guid id,
            KoffiegeselsContext dbContext,
            ICurrentUser currentUser) =>
        {
            var conversation = await dbContext.Conversations
                .AsNoTracking()
                .Where(c => c.Id == id && c.UserId == currentUser.UserId)
                .Select(c => new ConversationDetailDto(
                    c.Id,
                    c.Title,
                    c.CreatedAt,
                    c.UpdatedAt,
                    c.Messages
                        .OrderBy(m => m.CreatedAt)
                        .Select(m => new MessageDto(
                            m.Id,
                            m.Role,
                            m.Content,
                            m.CreatedAt))
                        .ToList()))
                .FirstOrDefaultAsync();

            return conversation is null ? Results.NotFound() : Results.Ok(conversation);
        })
        .Produces<ConversationDetailDto>()
        .Produces(StatusCodes.Status404NotFound);
    }
}
