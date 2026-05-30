namespace Koffiegesels.Api.Features.Conversations;

public record ConversationSummaryDto(
    Guid Id,
    string Title,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
