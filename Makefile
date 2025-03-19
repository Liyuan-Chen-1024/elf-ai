.PHONY: dev test lint clean

# Development
dev:
	@echo "Starting development environment..."
	@cp .env.base .env
	docker compose down --remove-orphans
	docker compose up

# Testing
test:
	@echo "Running tests..."
	@cat .env.base .env.test > .env.tmp
	@mv .env.tmp .env
	docker compose -f docker-compose.yml run --rm --build backend pytest -v --collect-only && \
	docker compose -f docker-compose.yml run --rm backend pytest -v

# Linting
lint:
	@echo "Running linters..."
	docker compose exec backend flake8 .
	docker compose exec backend black . --check
	docker compose exec backend isort . --check-only

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