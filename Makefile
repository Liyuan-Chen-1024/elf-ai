.PHONY: dev test lint clean up down logs ps restart celery-restart

# Development
dev:
	@echo "Starting all services..."
	@echo "View logs with: make logs"
	@echo "Restart Celery with: make celery-restart"
	@cp .env.base .env
	docker compose down --remove-orphans
	docker compose up -d
	@echo "Waiting for services to initialize..."
	@sleep 5
	@echo "Running database migrations..."
	docker compose exec backend python manage.py migrate
	@echo "Development environment is ready!"
	docker compose logs -f

test:
	@echo "Running ALL tests..."
	make test-backend
	make test-frontend

# Testing
test-backend:
	@echo "Running tests..."
	@cat .env.base .env.test > .env.tmp
	@mv .env.tmp .env
	docker compose -f docker-compose.yml run --rm --build backend pytest -v --collect-only && \
	docker compose -f docker-compose.yml run --rm backend pytest -v

test-frontend:
	@echo "Running tests..."
	@cat .env.base .env.test > .env.tmp
	@mv .env.tmp .env
	docker compose -f docker-compose.yml run --rm --build --entrypoint "npm" frontend test

lint:
	@echo "Running ALL lint..."
	make lint-frontend
	make lint-backend

lint-frontend:
	@echo "Running lint..."
	@cat .env.base .env.test > .env.tmp
	@mv .env.tmp .env
	docker compose -f docker-compose.yml run --rm --build --entrypoint "npm" frontend run lint

lint-backend:
	@echo "Running lint..."
	@cat .env.base .env.test > .env.tmp
	@mv .env.tmp .env
	docker compose -f docker-compose.yml run --rm --build backend flake8 .
	docker compose -f docker-compose.yml run --rm --build backend black . --check
	docker compose -f docker-compose.yml run --rm --build backend isort . --check-only

build:
	docker build --target production -t elfai-web:latest .

# Linting
lint:
	@echo "Running linters..."
	docker compose exec backend flake8 .
	docker compose exec backend black . --check
	docker compose exec backend isort . --check-only
	docker-compose run --rm web npm run format

# Cleanup
clean:
	@echo "Cleaning up..."
	docker compose down -v --remove-orphans
	rm -f .env .env.tmp
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name ".coverage" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name "*.egg-info" -exec rm -rf {} + 
	rm -rf frontend/node_modules
	rm -rf backend/venv

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

ps:
	docker-compose ps

restart:
	docker-compose restart

celery-restart:
	docker-compose restart celery_worker celery_beat
