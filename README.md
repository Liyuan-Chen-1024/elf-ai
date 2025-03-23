# ElfAI

A modern application with Django backend and React frontend.

## Development

Use the Makefile to manage your development workflow:

```bash
# Start all services
make dev

# Run tests
make test

# Run linters
make lint

# Clean up resources
make clean
```

## Testing

Running tests is straightforward with Make:

```bash
# Run all tests
make test

# Run only backend tests
make test-backend

# Run only frontend tests
make test-frontend
```

## Linting

Ensure code quality with the linting commands:

```bash
# Run all linters
make lint

# Run only backend linting
make lint-backend

# Run only frontend linting
make lint-frontend
```

## CI/CD

This project uses GitHub Actions for Continuous Integration. The workflows will:

1. Run all tests for both backend and frontend
2. Run linting checks for code quality
3. Verify database configuration to prevent the `:memory:` SQLite issue in PostgreSQL

The CI workflows are defined in:
- `.github/workflows/ci.yml` - Main workflow for tests and linting
- `.github/workflows/db-check.yml` - Special check for database configuration

To add new checks to CI, modify these workflow files.

## Architecture

The application consists of:

- Django backend (Python)
- React frontend (TypeScript)
- PostgreSQL database
- Redis for caching and Celery
- Celery for background tasks 