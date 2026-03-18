# ElfAI

A full-stack AI chat assistant with agentic capabilities — built with Django, React, and Celery.

ElfAI provides a conversational interface powered by LLMs with tool-calling abilities (web search, web fetch), persistent user memory that builds a profile over time, and background task processing for a responsive experience.

## How It Works

### Architecture Overview

```
┌─────────────┐     ┌──────────────────┐     ┌────────────┐
│   React UI  │────▶│  Django REST API  │────▶│ PostgreSQL │
│  (Vite/TS)  │◀────│  (DRF)           │     └────────────┘
└─────────────┘     └────────┬─────────┘
                             │
                    ┌────────▼─────────┐     ┌────────────┐
                    │  Celery Workers   │────▶│   Redis    │
                    │  (background AI)  │◀────│  (broker)  │
                    └──────────────────┘     └────────────┘
```

### Request Flow

1. **User sends a message** → API creates a user message + an agent placeholder (marked as "generating")
2. **Celery task fires** (`generate_agent_response`):
   - Loads the user's memory profile (structured JSON of interests, preferences, etc.)
   - Retrieves summaries from the last 10 conversations for context
   - Loads the 20 most recent messages from the current conversation
   - Builds a system prompt with all of the above
3. **Agent loop** (up to 8 turns):
   - Calls the LLM with streaming
   - If the model requests a tool call → executes it (web search or web fetch) → feeds the result back → continues
   - If the model returns text → streams content to the database in real-time (0.1s intervals)
4. **Background tasks** run asynchronously after the response:
   - **Memory extraction**: Parses the user's message to update their structured profile
   - **Conversation summary**: Generates/updates a summary for future context

### Tools

The agent has access to two tools for retrieving external information:

| Tool | Description |
|------|-------------|
| **Web Search** | DuckDuckGo search — returns snippets and URLs |
| **Web Fetch** | Fetches a URL and extracts clean text via BeautifulSoup |

Tools are registered via a registry pattern and exposed to the LLM as OpenAI-compatible function schemas.

### User Memory

ElfAI maintains a persistent structured profile for each user (stored as JSON in the Memory model). As conversations happen, a background task extracts details like personal information, interests, preferences, and travel plans — building a profile that gives the assistant context across conversations.

## Project Structure

```
elf-ai/
├── backend/
│   ├── apps/
│   │   ├── chat/              # Core chat logic
│   │   │   ├── models.py      # Conversation, Message, Memory
│   │   │   ├── views.py       # REST viewsets
│   │   │   ├── tasks.py       # Celery tasks (agent response, memory, summaries)
│   │   │   ├── tools.py       # Tool registry (web search, web fetch)
│   │   │   └── serializers.py
│   │   └── core/              # Base models, auth, logging
│   ├── config/
│   │   ├── settings/          # base / development / production / test
│   │   ├── celery.py          # Celery configuration
│   │   └── urls.py            # URL routing
│   ├── Dockerfile             # Multi-stage build
│   └── pyproject.toml         # Poetry dependencies
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── chat/          # Chat UI components, hooks, context
│   │   │   ├── auth/          # Authentication
│   │   │   └── profile/       # User profile
│   │   ├── services/          # API clients
│   │   └── types/             # TypeScript types
│   ├── Dockerfile             # Multi-stage build
│   └── package.json
├── docker-compose.yml         # All services orchestration
├── Makefile                   # Development workflow
├── .env.base                  # Base environment config
└── .github/workflows/         # CI/CD
```

## Setup

### Prerequisites

- Docker and Docker Compose

### Quick Start

```bash
# Start all services (builds images, runs migrations)
make dev

# Seed the database with a test user (admin/admin)
make seed
```

This starts 7 services:

| Service | Port | Purpose |
|---------|------|---------|
| **frontend** | 3000 | React dev server (Vite, hot-reload) |
| **backend** | 8000 | Django REST API |
| **celery_worker** | — | Processes background tasks |
| **celery_beat** | — | Scheduled/periodic tasks |
| **flower** | 5555 | Celery monitoring dashboard |
| **db** | 5432 | PostgreSQL 15 |
| **redis** | 6379 | Cache and message broker |

### Configuration

Key environment variables (in `.env.base`):

| Variable | Purpose |
|----------|---------|
| `LLM_API_URL` | LLM endpoint (OpenAI-compatible) |
| `LLM_MODEL_NAME` | Model to use (e.g., `gemma3`, `gpt-4`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection |
| `CELERY_BROKER_URL` | Celery broker (Redis) |

## Development

```bash
# Run all tests
make test

# Run backend tests only
make test-backend

# Run frontend tests only
make test-frontend

# Lint everything
make lint

# Format code (prettier, black, isort)
make format

# View logs
make logs

# Stop all services
make down

# Clean up
make clean
```

### API Documentation

Once running, API docs are available at:
- **Swagger UI**: `http://<host>:8000/api/schema/swagger-ui/`
- **ReDoc**: `http://<host>:8000/api/schema/redoc/`

### CI/CD

GitHub Actions runs on push/PR to main:
- Backend and frontend tests
- Linting checks (black, isort, flake8, eslint)
- Database configuration validation

Workflows defined in `.github/workflows/ci.yml`.

## Tech Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Framework | Django 5.0 + Django REST Framework 3.14 |
| Language | Python 3.11 |
| Database | PostgreSQL 15 |
| Task Queue | Celery 5.3 + Redis 7 |
| LLM Client | OpenAI Python SDK |
| Web Scraping | BeautifulSoup4 + DuckDuckGo Search |
| API Docs | drf-spectacular (OpenAPI 3.0) |
| Monitoring | Sentry, Structlog, Flower |
| Testing | pytest + pytest-django |
| Code Quality | black, isort, flake8, mypy |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 6.2 |
| State | Zustand + TanStack React Query |
| UI | Material-UI 6.4 |
| Routing | React Router 7.4 |
| Testing | Vitest |
| Code Quality | ESLint + Prettier |
