using Koffiegesels.Api.Data;
using Koffiegesels.Api.Features.Conversations;
using Koffiegesels.Api.Features.Messages;
using Koffiegesels.Api.Shared.Authentication;
using Microsoft.EntityFrameworkCore;

namespace Koffiegesels.Api.Features.Messages.AddMessage;

public static class AddMessageEndpoint
{
    public static void MapAddMessage(this IEndpointRouteBuilder app)
    {
        app.MapPost("/{id:guid}/messages", async (
            Guid id,
            AddMessageRequest request,
            KoffiegeselsContext dbContext,
            ICurrentUser currentUser,
            ILogger<Program> logger) =>
        {
            var conversation = await dbContext.Conversations
                .FirstOrDefaultAsync(c => c.Id == id && c.UserId == currentUser.UserId);

            if (conversation is null)
            {
                return Results.NotFound();
            }

            var now = DateTimeOffset.UtcNow;
            var message = new Message
            {
                Id = Guid.NewGuid(),
                ConversationId = conversation.Id,
                Role = MessageRole.User,
                Content = request.Content.Trim(),
                CreatedAt = now,
            };

            conversation.UpdatedAt = now;
            dbContext.Messages.Add(message);
            await dbContext.SaveChangesAsync();

            logger.LogInformation(
                "Added user message {MessageId} to conversation {ConversationId}",
                message.Id,
                conversation.Id);

            return Results.Created(
                $"/conversations/{conversation.Id}/messages/{message.Id}",
                new MessageResponseDto(
                    message.Id,
                    message.ConversationId,
                    message.Role,
                    message.Content,
                    message.CreatedAt));
        })
        .Produces<MessageResponseDto>(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status404NotFound)
        .ProducesValidationProblem();
    }
}
