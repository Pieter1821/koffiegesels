using Azure.Identity;
using Koffiegesels.Api.Data;
using Koffiegesels.Api.Features.Conversations;
using Koffiegesels.Api.Shared.Ai;
using Koffiegesels.Api.Shared.Authentication;
using Koffiegesels.Api.Shared.Cors;
using Koffiegesels.Api.Shared.ErrorHandling;
using Koffiegesels.Api.Shared.Guardrails;
using Koffiegesels.Api.Shared.OpenApi;
using Microsoft.AspNetCore.HttpLogging;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.Services.AddProblemDetails()
                .AddExceptionHandler<GlobalExceptionHandler>();

var credential = new DefaultAzureCredential(new DefaultAzureCredentialOptions
{
    ManagedIdentityClientId = builder.Configuration["AZURE_CLIENT_ID"]
});

builder.AddKoffiegeselsNpgsql<KoffiegeselsContext>("KoffiegeselsDB", credential);

// Configure authentication options with validation
builder.Services.AddOptions<AuthOptions>()
                .Bind(builder.Configuration.GetSection(AuthOptions.SectionName))
                .ValidateDataAnnotations()
                .ValidateOnStart();

// Register the JWT Bearer options configurator first
builder.Services.ConfigureOptions<JwtBearerOptionsSetup>();

// Then add the authentication services
builder.Services.AddAuthentication()
                .AddJwtBearer();

builder.Services.AddAuthorizationBuilder();

builder.Services.AddHttpLogging(options =>
{
    options.LoggingFields = HttpLoggingFields.RequestMethod |
                            HttpLoggingFields.RequestPath |
                            HttpLoggingFields.ResponseStatusCode |
                            HttpLoggingFields.Duration;
    options.CombineLogs = true;
});

builder.AddKoffiegeselsOpenApi();

builder.AddKoffiegeselsCors();

builder.AddKoffiegeselsAi();

builder.AddKoffiegeselsGuardrails();

// Real authenticated user, resolved per-request from the JWT 'sub' claim.
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();

builder.Services.AddValidation();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    // Explicit camelCase — matches frontend types (id, createdAt, …). Web defaults
    // already use camelCase; setting it here avoids regressions if defaults change.
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.Converters.Add(
        new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
});

var app = builder.Build();

app.UseCors();

app.UseHttpLogging();

if (app.Environment.IsDevelopment())
{
    app.UseKoffiegeselsSwaggerUI();
}
else
{
    app.UseExceptionHandler();
}

app.UseAuthentication();
app.UseAuthorization();

app.UseRateLimiter();

app.UseStatusCodePages();

app.MapDefaultEndpoints();
app.MapConversations();

await app.MigrateDbAsync();

app.Run();