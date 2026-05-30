using System.Text.RegularExpressions;

namespace Koffiegesels.Api.Shared.Guardrails;

/// <summary>Lightweight input screen before messages reach the model (no external API).</summary>
public static partial class ContentSafety
{
    public static bool TryValidate(string content, out string rejectionReason)
    {
        if (content.Contains('\0'))
        {
            rejectionReason = "Ongeldige karakters in die boodskap.";
            return false;
        }

        if (ExcessiveRepetition().IsMatch(content))
        {
            rejectionReason = "Die boodskap bevat te veel herhalende karakters.";
            return false;
        }

        rejectionReason = string.Empty;
        return true;
    }

    [GeneratedRegex(@"(.)\1{80,}")]
    private static partial Regex ExcessiveRepetition();
}
