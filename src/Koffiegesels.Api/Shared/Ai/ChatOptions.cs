using System.ComponentModel.DataAnnotations;

namespace Koffiegesels.Api.Shared.Ai;

public class AiChatOptions
{
    public const string SectionName = "Chat";

    [Range(1, 16_384)]
    public int MaxTokens { get; set; } = 1024;

    /// <summary>
    /// Maximum prior messages loaded from the database per request.
    /// The current user message is always sent in addition (up to this count + 1).
    /// </summary>
    [Range(1, 200)]
    public int MaxHistoryMessages { get; set; } = 40;
}

public class OllamaOptions
{
    public const string SectionName = "Ollama";

    [Required]
    public Uri Endpoint { get; set; } = new("http://localhost:11434");

    [Required]
    [StringLength(128)]
    public string Model { get; set; } = "llama3.2:3b";
}
