using Azure.Identity;
using Koffiegesels.Api.Data;
using Koffiegesels.Api.Shared.Cors;
using Koffiegesels.Api.Shared.ErrorHandling;
using Koffiegesels.Api.Shared.OpenApi;
using Koffiegesels.Api.Shared.Authentication;
using Microsoft.AspNetCore.HttpLogging;

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

builder.Services.AddValidation();

var app = builder.Build();

app.UseCors();

app.MapDefaultEndpoints();

app.UseHttpLogging();

if (app.Environment.IsDevelopment())
{
    app.UseKoffiegeselsSwaggerUI();
}
else
{
    app.UseExceptionHandler();
}

app.UseStatusCodePages();

await app.MigrateDbAsync();

app.Run();