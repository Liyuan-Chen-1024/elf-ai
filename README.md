# Jarvis Media Platform

Modern media management platform built with Django, React, and TypeScript.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/jarvis-media.git
cd jarvis-media

# Initial setup (only needed once)
make setup

# Start development environment
make dev
```

Visit:
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

## 🏗 Project Structure

```
jarvis-media/
└── apps/
    ├── api/            # Django Backend
    │   ├── apps/      # Django applications
    │   │   ├── core/  # Core functionality
    │   │   ├── shows/ # TV Shows management
    │   │   ├── chat/  # Chat functionality
    │   │   └── dashboard/ # Admin dashboard
    │   └── config/    # Django settings and configuration
    └── client/
        └── web/       # React Frontend
            ├── src/   # Source code
            └── public/ # Static files
```

## 🛠 Development

### Prerequisites

- Docker & Docker Compose
- Python 3.11+
- Node.js 18+ (for frontend development)
- Make

### Environment Variables

The `make setup` command will create a `.env` file from `.env.example`. Key variables:

- `DJANGO_SETTINGS_MODULE`: Django settings module (default: config.settings)
- `DATABASE_URL`: Database connection string
- `REDIS_URL`: Redis connection string
- `SECRET_KEY`: Django secret key
- `DJANGO_DEBUG`: Enable debug mode (default: False)

## 📚 Available Commands

### Development Commands

```bash
# Environment
make dev              # Start development environment
make stop            # Stop all services
make restart         # Restart development environment
make logs            # View container logs
make ps              # List running containers
make top             # Show running processes

# Shell Access
make shell-api       # Open Django shell
make shell-db        # Open database shell
make shell-web       # Open frontend shell

# Building
make build           # Build all containers
make build-api       # Build API container
make build-web       # Build frontend container
make build-no-cache  # Build without cache
```

### Debugging

To run the application with debugging enabled:

```bash
make dev-debug
```

#### VS Code/Cursor Configuration

1. Create `.vscode/launch.json` in your project root:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Django Debug",
            "type": "debugpy",
            "request": "attach",
            "connect": {
                "host": "localhost",
                "port": 5678
            },
            "pathMappings": [
                {
                    "localRoot": "${workspaceFolder}/apps/api",
                    "remoteRoot": "/app"
                }
            ],
            "django": true,
            "justMyCode": false,
            "cwd": "${workspaceFolder}/apps/api"
        },
        {
            "name": "React Debug",
            "type": "chrome",
            "request": "launch",
            "url": "http://localhost:3000",
            "webRoot": "${workspaceFolder}/apps/client/web",
            "sourceMapPathOverrides": {
                "/app/*": "${webRoot}/*"
            }
        }
    ],
    "compounds": [
        {
            "name": "Full Stack Debug",
            "configurations": ["Django Debug", "React Debug"]
        }
    ]
}
```

2. Create `.vscode/settings.json` for better Python/TypeScript integration:

```json
{
    "[python]": {
        "editor.defaultFormatter": "ms-python.python",
        "editor.formatOnSave": true
    },
    "editor.formatOnSave": true,
    "python.defaultInterpreterPath": "${workspaceFolder}/apps/api/.venv",
    "python.analysis.typeCheckingMode": "basic",
    "python.analysis.autoSearchPaths": true,
    "python.analysis.useLibraryCodeForTypes": true,
    "python.analysis.diagnosticSeverityOverrides": {
        "reportMissingTypeStubs": "none"
    },
    "editor.codeActionsOnSave": {
        "source.organizeImports": "explicit"
    },
    "files.exclude": {
        "**/.venv": true,
        "**/.mypy_cache": true,
        "**/.vscode-server": true,
        "**/__pycache__": true,
        "**/db.sqlite3": true,
        "**/.pytest_cache": true,
        "**/*.pyc": true,
        "**/node_modules": true
    },
    "typescript.tsdk": "apps/client/web/node_modules/typescript/lib",
    "debug.javascript.autoAttachFilter": "always",
    "debug.javascript.terminalOptions": {
        "skipFiles": [
            "<node_internals>/**"
        ]
    }
}
```

#### Using the Debugger

1. Start the application in debug mode:
```bash
make dev-debug
```

2. Set breakpoints in your code:
   - Backend: Set breakpoints in any Python file
   - Frontend: Set breakpoints in any TypeScript/JavaScript file

3. Start debugging:
   - Press F5 or use the Debug sidebar
   - Select "Django Debug" for backend only
   - Select "React Debug" for frontend only
   - Select "Full Stack Debug" to debug both simultaneously

4. View output:
   - Terminal output: `make logs`
   - Specific service logs:
     ```bash
     # Backend logs
     docker compose logs -f api
     
     # Frontend logs
     docker compose logs -f web
     ```
   - Debug console in your IDE

#### Debugging Tips

1. Hot Reloading:
   - Backend: Django's debug mode automatically reloads on file changes
   - Frontend: React's development server provides hot module replacement

2. Browser DevTools:
   - Access React Developer Tools
   - View Network requests
   - Check Console output

3. Django Debug Toolbar:
   - Available at any page with `?debug-toolbar`
   - Shows SQL queries, cache operations, and more

4. Performance Profiling:
   - Backend: `make profile-api`
   - Frontend: `make profile-web`

### Frontend Commands

```bash
# Testing
make test-web        # Run frontend tests
make test-e2e        # Run end-to-end tests
make test-integration # Run integration tests
make test-load       # Run load tests
make test-watch      # Run tests in watch mode
make test-coverage   # Generate coverage reports

# Code Quality
make lint            # Run all linters (includes frontend)
make format         # Format all code (includes frontend)

# Performance
make profile-web    # Run Lighthouse performance audit
```

### Database Commands

```bash
# Migrations
make db-migrate           # Run database migrations
make db-makemigrations   # Create new migrations

# Backup & Restore
make db-backup           # Create database backup
make db-restore FILE=<path>  # Restore from backup
make db-shell           # Open database shell
```

### Documentation

```bash
make docs            # Generate API documentation
make docs-serve      # Serve documentation locally
```

### Django Management Commands

The following Django commands are available through the API container:

```bash
# TV Shows Management
make shell-api  # Then run:
python manage.py fetch_tv_shows [options]  # Fetch and download episodes
    --show SHOW_NAME     # Process specific show
    --active-only       # Only process active shows
    --workers N         # Number of parallel workers (default: 3)
    --verbose          # Enable verbose output

python manage.py add_new_epguides_shows [options]  # Add new shows
    --activate         # Automatically activate new shows
    --delay N         # Delay between API requests (default: 5s)

python manage.py manage_tx_queue [options]  # Manage transmission queue
    --remove-completed  # Remove completed downloads
    --remove-failed    # Remove failed downloads
    --retry-failed     # Retry failed downloads
    --quiet           # Suppress non-error output

# File Management
python manage.py build_media_file_tree  # Index media files

python manage.py clean_downloaded_filenames [options]  # Clean filenames
    --dry-run         # Show what would be renamed
    --quiet          # Suppress progress output

python manage.py delete_unwanted_files [options]  # Clean up storage
    --dry-run         # Show what would be deleted
    --min-video-size N  # Minimum video size in MB (default: 100)
    --storage PATH    # Process specific storage path
```

## 🔧 Configuration

### Storage Paths

Configure media storage locations in your environment:
```python
STORAGE_PATHS = ['/media/tv', '/media/movies']  # Add your paths
```

### Redis Configuration

Redis is used for caching and health checks:
```python
REDIS_URL = 'redis://redis:6379/0'  # Default configuration
```

### API Rate Limiting

Configure rate limiting in settings:
```python
RATE_LIMIT_ENABLED = True
RATE_LIMIT_REQUESTS = 60  # requests per window
RATE_LIMIT_WINDOW = 60    # window size in seconds
```

## 📈 Monitoring

The platform includes several monitoring endpoints:

- `/health/`: System health check
- `/metrics/`: Prometheus metrics
- `/admin/`: Django admin interface

## 🔒 Security

- All endpoints require authentication by default
- CORS is configured for development
- Rate limiting is enabled
- SSL/TLS is required in production

## 📄 License

MIT License - see LICENSE for details 