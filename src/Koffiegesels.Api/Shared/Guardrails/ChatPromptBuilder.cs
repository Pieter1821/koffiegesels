using System.Text;
using Koffiegesels.Api.Features.Conversations;
using Koffiegesels.Api.Shared.Ai;
using Koffiegesels.Api.Shared.Prompts;
using Microsoft.Extensions.AI;

namespace Koffiegesels.Api.Shared.Guardrails;

/// <summary>Builds the bounded chat prompt: system prompt, optional recap of dropped turns, recent history.</summary>
public static class ChatPromptBuilder
{
    public static List<ChatMessage> Build(
        Conversation conversation,
        Message userMessage,
        AiChatOptions chatOptions,
        GuardrailsOptions guardrailsOptions)
    {
        var prior = conversation.Messages
            .Where(m => m.Id != userMessage.Id)
            .OrderBy(m => m.CreatedAt)
            .ToList();

        var maxHistory = chatOptions.MaxHistoryMessages;
        var dropped = prior.Count > maxHistory ? prior.Take(prior.Count - maxHistory).ToList() : [];
        var recent = prior.Count > maxHistory ? prior.TakeLast(maxHistory).ToList() : prior;

        var messages = new List<ChatMessage>
        {
            new(ChatRole.System, KoffiegeselsPrompts.System),
        };

        if (dropped.Count > 0)
        {
            messages.Add(new ChatMessage(ChatRole.System, FormatRecap(dropped, guardrailsOptions.RecapMaxChars)));
        }

        foreach (var message in recent)
        {
            messages.Add(ToChatMessage(message));
        }

        messages.Add(ToChatMessage(userMessage));
        return messages;
    }

    private static string FormatRecap(IReadOnlyList<Message> dropped, int maxChars)
    {
        var sb = new StringBuilder("Vorige dele van hierdie gesprek (gekort):\n");
        foreach (var message in dropped)
        {
            var prefix = message.Role == MessageRole.User ? "Gebruiker" : "Assistent";
            var line = message.Content.Replace('\n', ' ').Trim();
            if (line.Length > 120)
            {
                line = string.Concat(line.AsSpan(0, 117), "…");
            }

            sb.Append("- ").Append(prefix).Append(": ").AppendLine(line);
        }

        var text = sb.ToString();
        return text.Length <= maxChars ? text : string.Concat(text.AsSpan(0, maxChars - 1), "…");
    }

    private static ChatMessage ToChatMessage(Message message) =>
        new(ToChatRole(message.Role), message.Content);

    private static ChatRole ToChatRole(MessageRole role) => role switch
    {
        MessageRole.User => ChatRole.User,
        MessageRole.Assistant => ChatRole.Assistant,
        MessageRole.System => ChatRole.System,
        _ => ChatRole.User,
    };
}
