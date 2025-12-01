.PHONY: dev test lint lint-frontend lint-backend test-backend test-frontend clean up down logs ps restart celery-restart build

# Helper functions
define setup_base_env
	@echo "Setting up base environment..."
	@cp .env.base .env
endef

define setup_test_env
	@echo "Setting up test environment..."
	@cat .env.base .env.test > .env.tmp
	@mv .env.tmp .env
endef

# Development
dev:
	$(call setup_base_env)
	@echo "Checking LAN connectivity..."
	@# Start transparent proxy for LLM if on macOS (required for Docker Desktop LAN routing)
	@pgrep -f "socat TCP-LISTEN:8080" > /dev/null || (nohup socat TCP-LISTEN:8080,fork,bind=0.0.0.0 TCP:192.168.1.37:443 > /dev/null 2>&1 & echo "  -> Started transparent network bridge to LLM server")
	@echo "Starting all services..."
	@echo "View logs with: make logs"
	@echo "Restart Celery with: make celery-restart"
	docker compose down --remove-orphans
	docker compose up -d
	@echo "Waiting for services to initialize..."
	@sleep 5
	@echo "Running database migrations..."
	docker compose exec backend python manage.py migrate
	@echo "Development environment is ready!"
	docker compose logs -f

# Run all tests and linting
test:
	$(call setup_test_env)
	@echo "Running ALL tests and linting..."
	make lint
	make test-backend
	make test-frontend
	@echo "All tests passed!"

# Formatting
format:
	$(call setup_base_env)
	@echo "Formatting backend..."
	docker compose run --rm --entrypoint="" backend sh -c "cd /app && python -m black . && python -m isort ."
	@echo "Formatting frontend..."
	docker compose run --rm --entrypoint="" frontend sh -c "cd /app && [ -d node_modules ] || npm install && npm run format"

# Seeding
seed:
	$(call setup_base_env)
	@echo "Seeding database..."
	docker compose exec backend python manage.py create_test_user

# Testing
test-backend:
	$(call setup_test_env)
	@echo "Running backend tests..."
	@echo "Starting required services..."
	docker compose up -d db redis
	@echo "Waiting for services to be ready..."
	@sleep 5
	@echo "Applying migrations..."
	docker compose run --rm --build backend python manage.py migrate
	@echo "Running pytest tests..."
	docker compose run --rm backend pytest -v

test-frontend:
	$(call setup_test_env)
	@echo "Running frontend tests..."
	docker compose run --rm --build --entrypoint="" frontend sh -c "cd /app && [ -d node_modules ] || npm install && npm run test"

lint:
	$(call setup_test_env)
	@echo "Running ALL lint..."
	make lint-frontend
	make lint-backend

lint-frontend:
	$(call setup_test_env)
	@echo "Running lint..."
	docker compose run --rm --entrypoint="" frontend sh -c "cd /app && [ -d node_modules ] || npm install && npm run lint"
	docker compose run --rm --entrypoint="" frontend sh -c "cd /app && [ -d node_modules ] || npm install && npm run format"

lint-backend:
	$(call setup_test_env)
	@echo "Running lint..."
	@echo "Starting database containers if not running..."
	docker compose up -d db redis
	@echo "Waiting for database to be ready..."
	@sleep 5
	@echo "Checking code format with black..."
	docker compose run --rm --entrypoint="" backend sh -c "cd /app && python -m black . --check"
	@echo "Checking import order with isort..."
	docker compose run --rm --entrypoint="" backend sh -c "cd /app && python -m isort . --check-only"
	@echo "Checking code quality with flake8..."
	docker compose run --rm --entrypoint="" backend sh -c "cd /app && python -m flake8"

build:
	$(call setup_base_env)
	@echo "Building frontend and backend images..."
	docker build -f frontend/Dockerfile --target production -t elfai-frontend:latest ./frontend
	docker build -f backend/Dockerfile --target production -t elfai-backend:latest ./backend

# Cleanup
clean:
	@echo "Cleaning up..."
	$(call setup_base_env)
	@# Stop the network bridge
	-pkill -f "socat TCP-LISTEN:8080" || true
	-docker compose down -v --remove-orphans 2>/dev/null || true
	rm -f .env .env.tmp
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
	find . -type f -name ".coverage" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	-rm -rf frontend/node_modules 2>/dev/null || true
	-rm -rf backend/venv 2>/dev/null || true
	@echo "Clean completed successfully"

up:
	$(call setup_base_env)
	@echo "Starting all services..."
	docker compose up -d

down:
	$(call setup_base_env)
	docker compose down

logs:
	$(call setup_base_env)
	docker compose logs -f

ps:
	$(call setup_base_env)
	docker compose ps

restart:
	$(call setup_base_env)
	docker compose restart

celery-restart:
	$(call setup_base_env)
	docker compose restart celery_worker celery_beat
