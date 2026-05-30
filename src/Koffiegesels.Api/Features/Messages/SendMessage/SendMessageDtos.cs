using System.ComponentModel.DataAnnotations;
using Koffiegesels.Api.Features.Messages;

namespace Koffiegesels.Api.Features.Messages.SendMessage;

public record SendMessageRequest(
    [Required]
    [StringLength(16_000, MinimumLength = 1)]
    string Content);

public record SendMessageResponseDto(
    MessageResponseDto UserMessage,
    MessageResponseDto AssistantMessage);
