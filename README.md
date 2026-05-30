# Koffiegesels

Afrikaans-first chat API and web app. Built on .NET 10 with Aspire, PostgreSQL, and Keycloak (auth wired for later). Local development uses [Ollama](https://ollama.com) for zero-cost inference; production targets Azure OpenAI.

## Overview

- **Backend** — .NET 10 Web API, Entity Framework Core, PostgreSQL, vertical slice architecture
- **AI** — `Microsoft.Extensions.AI` with Ollama locally (`phi4-mini` by default; see model notes below); Azure OpenAI in production
- **Frontend** — React 19, TypeScript, Vite (chat UI in progress)
- **Orchestration** — Aspire AppHost (API, Postgres, Keycloak, pgAdmin)
- **Auth** — Keycloak realm included; JWT enforcement deferred until the chat loop is complete (see [Auth status](#auth-status))

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — Postgres and Keycloak
- [Aspire CLI](https://learn.microsoft.com/dotnet/aspire/cli/install) — optional; `dotnet run` works too
- [Node.js](https://nodejs.org/) — for the Vite frontend
- [Ollama](https://ollama.com) — for local AI replies (`ollama pull phi4-mini` or a 7B model; see below)

## Getting started

### Backend

From the repo root:

```bash
dotnet build Koffiegesels.slnx
dotnet run --project src/Koffiegesels.AppHost
```

Or:

```bash
aspire run
```

Use the Aspire dashboard URL from the terminal. The API is typically at `http://localhost:5082`. Swagger is available via **API Docs** on the dashboard in Development.

Database migrations run automatically on startup.

### Frontend

In a second terminal:

```bash
cd web
cp .env.example .env.local   # once
npm install
npm run dev                  # http://localhost:5173
```

The browser calls `/api`, which Vite proxies to the .NET API (`VITE_API_PROXY_TARGET` in `.env.local`).

### Ollama

Ensure Ollama is running and reachable:

```powershell
curl.exe http://localhost:11434
ollama list
```

Default model is set in `src/Koffiegesels.Api/appsettings.json` (`Ollama:Model`). Override via user-secrets if needed:

```bash
dotnet user-secrets set "Ollama:Model" "phi4-mini:latest" --project src/Koffiegesels.Api
```

**Model choice (~16 GB RAM):**

| Model | RAM when loaded | Quality | Notes |
|-------|-----------------|---------|-------|
| `phi4-mini:latest` | ~3 GB | Basic | Default — fast, light, weak Afrikaans |
| `qwen2.5:7b` | ~5–6 GB | Good | Best local balance for 16 GB systems |
| `llama3.1:8b` | ~5–6 GB | Good | Solid alternative to Qwen |
| `glm-4.6:cloud` | Low local | Best | Cloud — needs sign-in; heavy if run locally |

For noticeably better replies without cloud RAM cost:

```powershell
ollama pull qwen2.5:7b
dotnet user-secrets set "Ollama:Model" "qwen2.5:7b" --project src/Koffiegesels.Api
```

Restart the API after changing the model.


### Smoke test (recommended)

Runs create → list → send (AI) → get in one command:

```powershell
./scripts/smoke-test.ps1
```

Optional parameters:

```powershell
./scripts/smoke-test.ps1 -BaseUrl "http://localhost:5082" -Message "Hallo, wie is jy?"
```

The first AI call can take 15–30 seconds while Ollama loads the model.

### Swagger

Open **API Docs** from the Aspire dashboard. No OAuth is required for conversation routes during local development.

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/conversations` | Create a conversation (`{ "title": "..." }`) |
| `GET` | `/conversations` | List conversations (newest first) |
| `GET` | `/conversations/{id}` | Get conversation with messages |
| `DELETE` | `/conversations/{id}` | Delete conversation and messages |
| `POST` | `/conversations/{id}/messages` | Add a user message only (no AI) |
| `POST` | `/conversations/{id}/send` | Add user message, call AI, persist assistant reply |

The `/send` endpoint returns `{ "userMessage", "assistantMessage" }`. It may respond with `502`/`503` if Ollama is down or overloaded.

## Configuration

| Setting | Location | Notes |
|---------|----------|-------|
| `Ollama:Endpoint` | `appsettings.json` | Default `http://localhost:11434` |
| `Ollama:Model` | `appsettings.json` / user-secrets | e.g. `phi4-mini:latest`, `qwen2.5:7b` |
| `Chat:MaxTokens` | `appsettings.json` | Cap per AI request |
| `Chat:MaxHistoryMessages` | `appsettings.json` | Prior messages sent as context |
| `Auth:Authority` | AppHost env / config | Keycloak realm URL (injected by Aspire in run mode) |
| `Auth:Audience` | `appsettings.json` | Expected token audience (`koffiegesels-api`) |
| `AzureOpenAI:*` | user-secrets / Azure | Production inference (not wired yet) |
| `VITE_API_PROXY_TARGET` | `web/.env.local` | API URL for Vite dev proxy |
| `VITE_OIDC_*` | `web/.env.local` | Keycloak for frontend login (Phase 6) |

Do not commit secrets. Use `dotnet user-secrets` locally and Key Vault in Azure.

## Auth status

All conversation routes are **protected by Keycloak JWT** (`/conversations` group has `RequireAuthorization()`). Unauthenticated calls get `401`. The owning user is the token's `sub` claim (`ICurrentUser` → `CurrentUser`), and every query is scoped to that user. The frontend gates the UI behind an OIDC sign-in (`react-oidc-context`, PKCE) and attaches the Bearer token to all API + SSE calls.

Keycloak is orchestrated by Aspire:

| Purpose | Credentials |
|---------|-------------|
| Test user | `demo` / `demo` |
| Admin console | `admin` / `admin` |

Realm export: `src/Koffiegesels.AppHost/realms/koffiegesels-realm.json`

## Project structure

```
├── src/
│   ├── Koffiegesels.Api/           # Web API
│   │   ├── Features/
│   │   │   ├── Conversations/      # CRUD + entities
│   │   │   └── Messages/           # AddMessage, SendMessage (AI)
│   │   ├── Data/                   # KoffiegeselsContext, migrations
│   │   └── Shared/                 # Ai, Prompts, Cors, Authentication, OpenApi
│   ├── Koffiegesels.AppHost/       # Aspire orchestration
│   └── Koffiegesels.ServiceDefaults/
├── web/                            # React + Vite frontend
└── scripts/
    └── smoke-test.ps1              # End-to-end API smoke test
```

## Architecture

**Vertical slice architecture** — each operation lives under `Features/<Feature>/<Operation>/` with its endpoint and DTOs colocated. No shared service god-classes.

**AI access** — feature code injects `IChatClient` only. The concrete provider (Ollama in dev, Azure OpenAI in prod) is configured in `Shared/Ai`.

**System prompt** — Afrikaans instructions live in one versioned place: `Shared/Prompts/KoffiegeselsPrompts.cs`.

## Azure deployment

The repo includes Azure Developer CLI configuration (`azure.yaml`) and a GitHub Actions workflow (`.github/workflows/azure-dev.yml`). Production inference will use Azure OpenAI via the same `IChatClient` abstraction.

```bash
aspire deploy
```

Post-deploy: import the Keycloak realm from `src/Koffiegesels.AppHost/realms/koffiegesels-realm.json`.

## Contributing

See [AGENTS.md](AGENTS.md) for run commands, architecture rules, and guardrails for AI-assisted development.

## License

Provided as-is for development and educational use.
