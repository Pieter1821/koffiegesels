using Koffiegesels.Api.Features.Conversations.CreateConversation;
using Koffiegesels.Api.Features.Conversations.DeleteConversation;
using Koffiegesels.Api.Features.Conversations.GetConversation;
using Koffiegesels.Api.Features.Conversations.ListConversations;
using Koffiegesels.Api.Features.Messages.AddMessage;
using Koffiegesels.Api.Features.Messages.SendMessage;

namespace Koffiegesels.Api.Features.Conversations;

public static class ConversationsEndpoints
{
    public static void MapConversations(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/conversations")
                       .WithTags("Conversations");

        group.MapCreateConversation();
        group.MapListConversations();
        group.MapGetConversation();
        group.MapDeleteConversation();
        group.MapAddMessage();
        group.MapSendMessage();
    }
}
