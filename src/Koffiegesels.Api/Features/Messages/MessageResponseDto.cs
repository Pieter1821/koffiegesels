using Koffiegesels.Api.Features.Conversations;

namespace Koffiegesels.Api.Features.Messages;

public record MessageResponseDto(
    Guid Id,
    Guid ConversationId,
    MessageRole Role,
    string Content,
    DateTimeOffset CreatedAt);
