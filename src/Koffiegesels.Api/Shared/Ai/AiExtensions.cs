using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;
using OllamaSharp;

namespace Koffiegesels.Api.Shared.Ai;

public static class AiExtensions
{
    public static IHostApplicationBuilder AddKoffiegeselsAi(this IHostApplicationBuilder builder)
    {
        builder.Services.AddOptions<OllamaOptions>()
                        .Bind(builder.Configuration.GetSection(OllamaOptions.SectionName))
                        .ValidateDataAnnotations()
                        .ValidateOnStart();

        builder.Services.AddOptions<AiChatOptions>()
                        .Bind(builder.Configuration.GetSection(AiChatOptions.SectionName))
                        .ValidateDataAnnotations()
                        .ValidateOnStart();

        builder.Services.AddChatClient(serviceProvider =>
        {
            var ollama = serviceProvider.GetRequiredService<Microsoft.Extensions.Options.IOptions<OllamaOptions>>().Value;
            return new OllamaApiClient(ollama.Endpoint, ollama.Model);
        });

        return builder;
    }
}
