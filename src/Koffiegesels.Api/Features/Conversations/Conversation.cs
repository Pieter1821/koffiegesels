namespace Koffiegesels.Api.Features.Conversations;

/// <summary>
/// A chat thread owned by a single user. Aggregate root for its messages.
/// </summary>
public class Conversation
{
    public Guid Id { get; set; }

    /// <summary>Owner identifier. Maps to the JWT <c>sub</c> claim once auth lands; a dev stub until then.</summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>Display title, typically derived from the first user message.</summary>
    public string Title { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
