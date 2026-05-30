using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Koffiegesels.Api.Data;
using Koffiegesels.Api.Features.Conversations;
using Koffiegesels.Api.Features.Messages;
using Koffiegesels.Api.Features.Messages.SendMessage;
using Koffiegesels.Api.Shared.Ai;
using Koffiegesels.Api.Shared.Authentication;
using Koffiegesels.Api.Shared.Guardrails;
using Koffiegesels.Api.Shared.Prompts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Options;

namespace Koffiegesels.Api.Features.Messages.StreamMessage;

/// <summary>
/// Server-Sent Events variant of SendMessage: streams the assistant reply
/// token-by-token. Frame contract:
///   event: meta   data: { "userMessage": { ... } }
///   event: token  data: { "delta": "..." }            (repeated)
///   event: done   data: { "assistantMessage": { ... } }
///   event: error  data: { "title", "detail", "status" }
/// </summary>
public static class StreamMessageEndpoint
{
    private static readonly JsonSerializerOptions SseJson = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    public static void MapStreamMessage(this IEndpointRouteBuilder app)
    {
        app.MapPost("/{id:guid}/stream", async (
            Guid id,
            SendMessageRequest request,
            HttpContext httpContext,
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
                await unsafeResult.ExecuteAsync(httpContext);
                return;
            }

            if (await AiRequestGuards.RejectOverDailyCapAsync(
                    dbContext,
                    currentUser.UserId,
                    guardrailsOptions.Value,
                    cancellationToken) is { } capResult)
            {
                await capResult.ExecuteAsync(httpContext);
                return;
            }

            var conversation = await dbContext.Conversations
                .Include(c => c.Messages)
                .FirstOrDefaultAsync(
                    c => c.Id == id && c.UserId == currentUser.UserId,
                    cancellationToken);

            if (conversation is null)
            {
                httpContext.Response.StatusCode = StatusCodes.Status404NotFound;
                return;
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
            await dbContext.SaveChangesAsync(cancellationToken);

            var prompt = ChatPromptBuilder.Build(
                conversation,
                userMessage,
                chatOptions.Value,
                guardrailsOptions.Value);

            httpContext.Response.Headers.ContentType = "text/event-stream";
            httpContext.Response.Headers.CacheControl = "no-cache";
            httpContext.Response.Headers["X-Accel-Buffering"] = "no";

            async Task WriteEvent(string name, object payload)
            {
                var json = JsonSerializer.Serialize(payload, SseJson);
                await httpContext.Response.WriteAsync($"event: {name}\n", cancellationToken);
                await httpContext.Response.WriteAsync($"data: {json}\n\n", cancellationToken);
                await httpContext.Response.Body.FlushAsync(cancellationToken);
            }

            var builder = new StringBuilder();

            try
            {
                await WriteEvent("meta", new { userMessage = ToDto(userMessage) });

                var options = new ChatOptions { MaxOutputTokens = chatOptions.Value.MaxTokens };
                await foreach (var update in chatClient
                    .GetStreamingResponseAsync(prompt, options, cancellationToken)
                    .ConfigureAwait(false))
                {
                    if (string.IsNullOrEmpty(update.Text))
                    {
                        continue;
                    }

                    builder.Append(update.Text);
                    await WriteEvent("token", new { delta = update.Text });
                }
            }
            catch (OperationCanceledException)
            {
                return;
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
            {
                logger.LogWarning(ex, "AI stream failed for conversation {ConversationId}", conversation.Id);
                await WriteEvent("error", new
                {
                    title = "AI-diens nie beskikbaar nie",
                    detail = "Kon nie met Ollama skakel nie. Maak seker Ollama loop en die model is afgelaai.",
                    status = StatusCodes.Status503ServiceUnavailable,
                });
                return;
            }

            var assistantText = builder.ToString().Trim();
            if (string.IsNullOrEmpty(assistantText))
            {
                await WriteEvent("error", new
                {
                    title = "Leë AI-antwoord",
                    detail = "Die model het geen teks teruggegee nie.",
                    status = StatusCodes.Status502BadGateway,
                });
                return;
            }

            var assistantMessage = new Message
            {
                Id = Guid.NewGuid(),
                ConversationId = conversation.Id,
                Role = MessageRole.Assistant,
                Content = assistantText,
                CreatedAt = DateTimeOffset.UtcNow,
                TokenCount = UserUsageLimits.EstimateTokens(assistantText),
            };

            dbContext.Messages.Add(assistantMessage);
            conversation.UpdatedAt = assistantMessage.CreatedAt;
            await dbContext.SaveChangesAsync(cancellationToken);

            logger.LogInformation(
                "StreamMessage completed for conversation {ConversationId}, promptVersion {PromptVersion}",
                conversation.Id,
                KoffiegeselsPrompts.Version);

            await WriteEvent("done", new { assistantMessage = ToDto(assistantMessage) });
        })
        .WithName("StreamMessage")
        .WithTags("Messages")
        .RequireRateLimiting(GuardrailsExtensions.ChatRateLimitPolicy)
        .Produces(StatusCodes.Status200OK, contentType: "text/event-stream")
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status404NotFound)
        .Produces(StatusCodes.Status429TooManyRequests)
        .ProducesValidationProblem();
    }

    private static MessageResponseDto ToDto(Message message) =>
        new(message.Id, message.ConversationId, message.Role, message.Content, message.CreatedAt);
}
