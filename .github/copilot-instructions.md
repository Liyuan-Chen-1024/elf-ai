# ElfAI Development Guide

ElfAI is an AI chat application with smart home integrations, built with Django backend and React frontend.

## Core Architecture

### Integration Registry System
The project uses a sophisticated dependency injection pattern in `backend/apps/core/registry.py`:
- **Integration base class**: All integrations inherit from `Integration` and register with `@Integration.register()`
- **Dependencies**: Declare dependencies as `dependencies = [APIIntegration]` class attribute
- **Dependency injection**: Access dependencies via `self.get_dependency(APIIntegration)`
- **Example**: See `backend/apps/integrations/smart_home/philips_hue.py` for the pattern

### Smart Home Integrations
Integrations live in `backend/apps/integrations/` and follow this pattern:
```python
@Integration.register()
class MyIntegration(Integration):
    dependencies = [APIIntegration]  # Declare dependencies
    
    def get_integration(self):
        return {"type": "my_type", "id": self.instance_id}
```

### Chat System
- **Models**: `Conversation` and `Message` in `backend/apps/chat/models.py`
- **Streaming**: Real-time chat via `StreamingHttpResponse` in views
- **Background tasks**: Agent responses processed via Celery in `backend/apps/chat/tasks.py`
- **Frontend**: React chat interface in `frontend/src/features/chat/`

## Development Workflow

### Essential Commands
**Always use the Makefile** - it handles environment setup correctly:
```bash
make dev          # Start all services (copies .env.base to .env)
make test         # Run all tests with test environment
make lint         # Run all linters
make clean        # Clean up resources
```

### Environment Setup
- Base config: `.env.base` (committed)
- Development: Makefile copies `.env.base` to `.env`
- Testing: Makefile merges `.env.base` + `.env.test`
- **Never run `docker compose` directly** - use Makefile commands

### Backend Development
- **Django settings**: Environment-based in `config/settings/`
- **Debugging**: VS Code debugger available on port 5678
- **Dependencies**: Poetry managed in `pyproject.toml`
- **Database**: PostgreSQL with automatic migrations via `make dev`

### Frontend Development
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Material-UI with custom theme
- **State**: React Query for server state, React Context for app state
- **Testing**: Vitest + React Testing Library
- **Features**: Organized by domain in `src/features/`

## Code Conventions

### Import Organization
Follow the patterns in `.cursor/rules/imports.mdc`:
1. External dependencies
2. Internal shared modules (relative imports)
3. Local components/modules (relative imports)
4. Types
5. Styles

### Testing Requirements
- **Backend**: pytest with Django test database
- **Frontend**: Vitest for unit tests, Cypress for E2E
- **Coverage**: Required for all new code
- **Commands**: `make test` (all), `make test-backend`, `make test-frontend`

### Integration Development
When creating new integrations:
1. Inherit from `Integration` base class
2. Use `@Integration.register()` decorator
3. Declare dependencies as class attribute
4. Implement `get_integration()` method
5. Use dependency injection pattern for external services

### Docker Development
- **Hot reload**: Backend and frontend code volumes mounted
- **Services**: PostgreSQL, Redis, Celery, Django, React
- **Networking**: All services on `elfai-network`
- **Debugging**: Backend debugger on port 5678, accessible from VS Code

## Key Files
- `Makefile`: **Essential** - all development commands
- `backend/apps/core/registry.py`: Dependency injection system
- `backend/apps/integrations/`: Smart home integrations
- `backend/apps/chat/`: Chat system with streaming
- `frontend/src/features/`: Feature-based React components
- `.cursor/rules/`: Existing code conventions (reference only)
