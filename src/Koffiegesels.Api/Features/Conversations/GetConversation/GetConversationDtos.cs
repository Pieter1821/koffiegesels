using Koffiegesels.Api.Features.Conversations;

namespace Koffiegesels.Api.Features.Conversations.GetConversation;

public record MessageDto(
    Guid Id,
    MessageRole Role,
    string Content,
    DateTimeOffset CreatedAt);

public record ConversationDetailDto(
    Guid Id,
    string Title,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<MessageDto> Messages);
