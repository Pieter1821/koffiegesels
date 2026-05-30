using System.ComponentModel.DataAnnotations;

namespace Koffiegesels.Api.Shared.Guardrails;

public class GuardrailsOptions
{
    public const string SectionName = "Guardrails";

    /// <summary>Max AI requests (send + stream) per user per minute.</summary>
    [Range(1, 1_000)]
    public int RequestsPerMinute { get; set; } = 20;

    /// <summary>Max estimated output tokens per user per UTC day (assistant replies).</summary>
    [Range(1, 10_000_000)]
    public int DailyTokenCap { get; set; } = 100_000;

    /// <summary>Characters allowed in the compact recap of dropped history turns.</summary>
    [Range(200, 4_000)]
    public int RecapMaxChars { get; set; } = 900;
}
