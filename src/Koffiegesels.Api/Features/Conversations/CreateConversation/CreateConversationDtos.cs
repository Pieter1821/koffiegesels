using System.ComponentModel.DataAnnotations;

namespace Koffiegesels.Api.Features.Conversations.CreateConversation;

public record CreateConversationRequest(
    [StringLength(200)] string? Title = null);
