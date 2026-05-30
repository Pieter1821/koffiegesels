using System.ComponentModel.DataAnnotations;

namespace Koffiegesels.Api.Features.Messages.AddMessage;

public record AddMessageRequest(
    [Required]
    [StringLength(16_000, MinimumLength = 1)]
    string Content);
