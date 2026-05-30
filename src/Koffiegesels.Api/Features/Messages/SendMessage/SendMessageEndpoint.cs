using Koffiegesels.Api.Data;
using Koffiegesels.Api.Features.Conversations;
using Koffiegesels.Api.Features.Messages;
using Koffiegesels.Api.Shared.Ai;
using Koffiegesels.Api.Shared.Authentication;
using Koffiegesels.Api.Shared.Guardrails;
using Koffiegesels.Api.Shared.Prompts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Options;

namespace Koffiegesels.Api.Features.Messages.SendMessage;

public static class SendMessageEndpoint
{
    public static void MapSendMessage(this IEndpointRouteBuilder app)
    {
        app.MapPost("/{id:guid}/send", async (
            Guid id,
            SendMessageRequest request,
            KoffiegeselsContext dbContext,
            ICurrentUser currentUser,
            IChatClient chatClient,
            IOptions<AiChatOptions> chatOptions,
            IOptions<GuardrailsOptions> guardrailsOptions,
            ILogger<Program> logger,
            CancellationToken cancellationToken) =>
        {
            var trimmed = request.Content.Trim();

            if (AiRequestGuards.RejectUnsafeContent(trimmed) is { } unsafeResult)
            {
                return unsafeResult;
            }

            if (await AiRequestGuards.RejectOverDailyCapAsync(
                    dbContext,
                    currentUser.UserId,
                    guardrailsOptions.Value,
                    cancellationToken) is { } capResult)
            {
                return capResult;
            }

            var conversation = await dbContext.Conversations
                .Include(c => c.Messages)
                .FirstOrDefaultAsync(
                    c => c.Id == id && c.UserId == currentUser.UserId,
                    cancellationToken);

            if (conversation is null)
            {
                return Results.NotFound();
            }

            var now = DateTimeOffset.UtcNow;
            var userMessage = new Message
            {
                Id = Guid.NewGuid(),
                ConversationId = conversation.Id,
                Role = MessageRole.User,
                Content = trimmed,
                CreatedAt = now,
            };

            dbContext.Messages.Add(userMessage);

            var messages = ChatPromptBuilder.Build(
                conversation,
                userMessage,
                chatOptions.Value,
                guardrailsOptions.Value);

            ChatResponse aiResponse;
            try
            {
                aiResponse = await chatClient.GetResponseAsync(
                    messages,
                    new ChatOptions { MaxOutputTokens = chatOptions.Value.MaxTokens },
                    cancellationToken);
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
            {
                logger.LogWarning(
                    ex,
                    "AI request failed for conversation {ConversationId}",
                    conversation.Id);

                return Results.Problem(
                    title: "AI-diens nie beskikbaar nie",
                    detail: "Kon nie met Ollama skakel nie. Maak seker Ollama loop en die model is afgelaai.",
                    statusCode: StatusCodes.Status503ServiceUnavailable);
            }

            var assistantText = aiResponse.Text?.Trim();
            if (string.IsNullOrEmpty(assistantText))
            {
                return Results.Problem(
                    title: "Leë AI-antwoord",
                    detail: "Die model het geen teks teruggegee nie.",
                    statusCode: StatusCodes.Status502BadGateway);
            }

            var assistantMessage = new Message
            {
                Id = Guid.NewGuid(),
                ConversationId = conversation.Id,
                Role = MessageRole.Assistant,
                Content = assistantText,
                CreatedAt = DateTimeOffset.UtcNow,
                TokenCount = aiResponse.Usage?.OutputTokenCount is long outputTokens
                    ? (int)Math.Min(outputTokens, int.MaxValue)
                    : UserUsageLimits.EstimateTokens(assistantText),
            };

            dbContext.Messages.Add(assistantMessage);
            conversation.UpdatedAt = assistantMessage.CreatedAt;
            await dbContext.SaveChangesAsync(cancellationToken);

            logger.LogInformation(
                "SendMessage completed for conversation {ConversationId}, promptVersion {PromptVersion}",
                conversation.Id,
                KoffiegeselsPrompts.Version);

            return Results.Ok(new SendMessageResponseDto(
                ToDto(userMessage),
                ToDto(assistantMessage)));
        })
        .WithName("SendMessage")
        .WithTags("Messages")
        .RequireRateLimiting(GuardrailsExtensions.ChatRateLimitPolicy)
        .Produces<SendMessageResponseDto>()
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status429TooManyRequests)
        .Produces(StatusCodes.Status502BadGateway)
        .Produces(StatusCodes.Status503ServiceUnavailable)
        .ProducesValidationProblem();
    }

    private static MessageResponseDto ToDto(Message message) =>
        new(message.Id, message.ConversationId, message.Role, message.Content, message.CreatedAt);
}
