namespace Koffiegesels.Api.Features.Conversations;

/// <summary>Author role of a chat message.</summary>
public enum MessageRole
{
    User,
    Assistant,
    System,
}

/// <summary>A single message within a <see cref="Conversation"/>.</summary>
public class Message
{
    public Guid Id { get; set; }

    public Guid ConversationId { get; set; }

    public MessageRole Role { get; set; }

    public string Content { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>Token count for usage tracking and budgeting. Null until computed.</summary>
    public int? TokenCount { get; set; }

    public Conversation Conversation { get; set; } = null!;
}
