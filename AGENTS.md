# Koffiegesels — Agent & Contributor Guide

Afrikaans-first chat API on .NET 10 (Aspire) + Azure OpenAI. Backend derived from an enterprise blueprint (vertical slice architecture, Keycloak auth, PostgreSQL, OpenTelemetry).

## Run

```bash
# from repo root
dotnet build Koffiegesels.slnx
dotnet run --project src/Koffiegesels.AppHost   # or: aspire run
```

The Aspire AppHost orchestrates the API, PostgreSQL, and Keycloak. Use the Aspire dashboard URL printed on startup.

## Architecture rules

- **Vertical slices only.** Each feature lives under `src/Koffiegesels.Api/Features/<Feature>/<Operation>/` with its endpoint + DTOs together. No shared "Services" god-classes.
- **AI access via `IChatClient`** (`Microsoft.Extensions.AI`). Never inject `AzureOpenAIClient`/`OpenAIClient` into feature code; configure the concrete client only in composition root (`Shared/Ai`).
- **Afrikaans system prompt lives in one place** (`Shared/Prompts`), versioned. Do not scatter prompt text across endpoints.
- **Auth required on all chat routes** (Keycloak JWT). No parallel API-key auth path.

## Guardrails

- No secrets in the repo. Use `dotnet user-secrets` locally; Key Vault / Managed Identity in Azure.
- Do not log full prompt/response bodies in production config.
- Do not add new packages (Semantic Kernel, AI Search, agent frameworks, RAG libs) without an explicit task. Keep scope tight.
- PRDs and planning docs are git-ignored. Do not commit them.

## Environment / config

| Setting | Where | Notes |
|---------|-------|-------|
| `AzureOpenAI:Endpoint` | user-secrets / Azure | Azure OpenAI resource endpoint |
| `AzureOpenAI:Deployment` | user-secrets / Azure | e.g. `gpt-4o-mini` |
| `Auth:Authority` | Aspire / env | Keycloak realm URL |
| `SWAGGERUI_CLIENTID` | config | Swagger OAuth client |

Local Keycloak test user: `demo` / `demo`. Admin: `admin` / `admin`.

## Inference

- **Dev:** Ollama (zero spend) via `IChatClient`.
- **Prod:** Azure OpenAI `gpt-4o-mini`. Keep a strict Azure budget with alerts; cap `MaxTokens` per request and rate-limit per user.
