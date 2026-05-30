using Koffiegesels.Api.Data;
using Koffiegesels.Api.Features.Conversations;
using Koffiegesels.Api.Shared.Dev;

namespace Koffiegesels.Api.Features.Conversations.CreateConversation;

public static class CreateConversationEndpoint
{
    public const string DefaultTitle = "Nuwe gesprek";

    public static void MapCreateConversation(this IEndpointRouteBuilder app)
    {
        app.MapPost("/", async (
            CreateConversationRequest request,
            KoffiegeselsContext dbContext,
            ICurrentUser currentUser,
            ILogger<Program> logger) =>
        {
            var now = DateTimeOffset.UtcNow;
            var title = string.IsNullOrWhiteSpace(request.Title)
                ? DefaultTitle
                : request.Title.Trim();

            var conversation = new Conversation
            {
                Id = Guid.NewGuid(),
                UserId = currentUser.UserId,
                Title = title,
                CreatedAt = now,
                UpdatedAt = now,
            };

            dbContext.Conversations.Add(conversation);
            await dbContext.SaveChangesAsync();

            logger.LogInformation(
                "Created conversation {ConversationId} for user {UserId}",
                conversation.Id,
                currentUser.UserId);

            return Results.Created(
                $"/conversations/{conversation.Id}",
                new ConversationSummaryDto(
                    conversation.Id,
                    conversation.Title,
                    conversation.CreatedAt,
                    conversation.UpdatedAt));
        })
        .Produces<ConversationSummaryDto>(StatusCodes.Status201Created)
        .ProducesValidationProblem();
    }
}
