# Makefile for elfai Media Platform

# Configuration
.PHONY: help setup dev test deploy clean down

# Environment variables
ENV ?= development
DOCKER_COMPOSE_BASE = docker-compose.yml
DOCKER_COMPOSE_PROD = docker-compose.prod.yml

ifeq ($(ENV),development)
	DOCKER_COMPOSE = docker compose -f $(DOCKER_COMPOSE_BASE)
	REQUIRE_ENV_FILE = false
else
	DOCKER_COMPOSE = docker compose -f $(DOCKER_COMPOSE_BASE) -f $(DOCKER_COMPOSE_PROD)
	REQUIRE_ENV_FILE = true
endif

# Colors
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

# Help
help: ## Show this help message
	@echo "Usage: make [target] [ENV=development|production]"
	@echo ""
	@echo "$(GREEN)Docker Commands:$(RESET)"
	@awk -F ':|##' '/^[^\t].+?:.*?##.*Docker.*/ { printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$NF }' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(YELLOW)Local Commands:$(RESET)"
	@awk -F ':|##' '/^[^\t].+?:.*?##.*Local.*/ { printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$NF }' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(GREEN)Django Extensions:$(RESET)"
	@awk -F ':|##' '/^[^\t].+?:.*?##.*Django Extensions.*/ { printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$NF }' $(MAKEFILE_LIST)
	@echo ""
	@echo "Current environment: $(ENV)"
	@if [ "$(ENV)" != "development" ]; then \
		echo "$(YELLOW)Note: Production environment requires a .env file$(RESET)"; \
	fi

#-----------------------------------------------------------------------------------------------------------------------
# Initial Setup (Local)
#-----------------------------------------------------------------------------------------------------------------------

setup: check-env ## Local: Initial project setup (run once)
	@echo "�� Setting up project..."
	@if [ "$(ENV)" != "development" ]; then \
		if [ ! -f .env.example ]; then \
			echo "$(RED)Error: .env.example file not found$(RESET)"; \
			exit 1; \
		fi; \
		cp .env.example .env; \
		echo "$(GREEN)Created .env file from .env.example$(RESET)"; \
	fi
	@command -v pre-commit >/dev/null 2>&1 || { echo "$(RED)Error: pre-commit is not installed. Please install it first.$(RESET)"; exit 1; }
	pre-commit install
	@echo "✨ Setup complete! Run 'make dev' to start development environment"

#-----------------------------------------------------------------------------------------------------------------------
# Development (Docker)
#-----------------------------------------------------------------------------------------------------------------------

dev: check-env ## Docker: Start development environment
	$(DOCKER_COMPOSE) up -d
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "🔧 API: http://localhost:8000"
	@echo "🔍 Running in $(ENV) mode"

dev-debug: check-env ## Docker: Start development environment with debugging enabled
	$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.debug.yml up -d
	@echo "🌐 Frontend: http://localhost:3000"
	@echo "🔧 API: http://localhost:8000"
	@echo "🐛 API Debug Port: 5678"
	@echo "🐛 Web Debug Port: 9229"
	@echo "🔍 Running in debug mode"

stop: ## Docker: Stop development environment
	$(DOCKER_COMPOSE) down

restart: stop dev ## Docker: Restart development environment

logs: ## Docker: View container logs
	$(DOCKER_COMPOSE) logs -f

ps: ## Docker: List running containers
	$(DOCKER_COMPOSE) ps

top: ## Docker: Show running processes in containers
	$(DOCKER_COMPOSE) top

shell-api: check-running ## Docker: Open API shell
	$(DOCKER_COMPOSE) exec api python manage.py shell

shell-db: check-running ## Docker: Open database shell
	$(DOCKER_COMPOSE) exec db mysql -u elfai -pelfai elfai

shell-web: check-running ## Docker: Open web shell
	$(DOCKER_COMPOSE) exec web sh

#-----------------------------------------------------------------------------------------------------------------------
# Testing (Docker)
#-----------------------------------------------------------------------------------------------------------------------

test: check-running ## Docker: Run all tests
	@echo "Running API tests..."
	@$(DOCKER_COMPOSE) exec -T api sh -c "PYTHONPATH=/app DJANGO_SETTINGS_MODULE=config.settings.test pytest -v" || { echo "$(RED)API tests failed$(RESET)"; exit 1; }
	@echo "Running Web tests..."
	@$(DOCKER_COMPOSE) exec -T web npm test || { echo "$(RED)Web tests failed$(RESET)"; exit 1; }

test-api: check-running ## Docker: Run API tests
	$(DOCKER_COMPOSE) exec api sh -c "PYTHONPATH=/app DJANGO_SETTINGS_MODULE=config.settings.test pytest -v"

test-web: check-running ## Docker: Run web tests
	$(DOCKER_COMPOSE) exec web npm test

test-watch: check-running ## Docker: Run tests in watch mode
	$(DOCKER_COMPOSE) exec web npm run test:watch

test-e2e: check-running ## Docker: Run end-to-end tests
	$(DOCKER_COMPOSE) exec web npm run test:e2e

test-integration: check-running ## Docker: Run integration tests
	$(DOCKER_COMPOSE) exec web npm run test:integration

test-load: check-running ## Docker: Run load tests
	$(DOCKER_COMPOSE) exec web npm run test:load

test-benchmark: check-running ## Docker: Run benchmark tests
	$(DOCKER_COMPOSE) exec api pytest --benchmark-only

test-coverage: check-running ## Docker: Generate test coverage reports
	@echo "Generating API coverage..."
	@$(DOCKER_COMPOSE) exec -T api pytest --cov-report=html || { echo "$(RED)API coverage generation failed$(RESET)"; exit 1; }
	@echo "Generating Web coverage..."
	@$(DOCKER_COMPOSE) exec -T web npm run test:coverage || { echo "$(RED)Web coverage generation failed$(RESET)"; exit 1; }
	@echo "📊 Coverage reports generated in apps/api/htmlcov and apps/client/web/coverage"

#-----------------------------------------------------------------------------------------------------------------------
# Quality Assurance (Docker)
#-----------------------------------------------------------------------------------------------------------------------

lint: check-running ## Docker: Run all linters
	@echo "Linting API..."
	@$(DOCKER_COMPOSE) exec -T api sh -c "black . --check && isort . --check && flake8 && mypy . && bandit -r . && safety check" || { echo "$(RED)API linting failed$(RESET)"; exit 1; }
	@echo "Linting Web..."
	@$(DOCKER_COMPOSE) exec -T web sh -c "npm run lint && npm run type-check" || { echo "$(RED)Web linting failed$(RESET)"; exit 1; }

format: check-running ## Docker: Format all code
	@echo "Formatting API code..."
	@$(DOCKER_COMPOSE) exec -T api sh -c "black . && isort ." || { echo "$(RED)API formatting failed$(RESET)"; exit 1; }
	@echo "Formatting Web code..."
	@$(DOCKER_COMPOSE) exec -T web npm run format || { echo "$(RED)Web formatting failed$(RESET)"; exit 1; }

#-----------------------------------------------------------------------------------------------------------------------
# Documentation (Docker)
#-----------------------------------------------------------------------------------------------------------------------

docs: check-running ## Docker: Generate API documentation
	@$(DOCKER_COMPOSE) exec -T api sphinx-build -b html docs/source docs/build || { echo "$(RED)Documentation generation failed$(RESET)"; exit 1; }

docs-serve: check-running ## Docker: Serve documentation locally
	$(DOCKER_COMPOSE) exec api sphinx-autobuild docs/source docs/build --host 0.0.0.0

#-----------------------------------------------------------------------------------------------------------------------
# Building (Docker)
#-----------------------------------------------------------------------------------------------------------------------

build: ## Docker: Build all containers
	$(DOCKER_COMPOSE) build

build-api: ## Docker: Build API container
	$(DOCKER_COMPOSE) build api

build-web: ## Docker: Build web container
	$(DOCKER_COMPOSE) build web

build-no-cache: ## Docker: Build all containers without cache
	$(DOCKER_COMPOSE) build --no-cache

#-----------------------------------------------------------------------------------------------------------------------
# Deployment (Docker)
#-----------------------------------------------------------------------------------------------------------------------

deploy-staging: ## Docker: Deploy to staging environment
	@if [ "$(ENV)" != "staging" ]; then \
		echo "$(RED)Error: Must be run with ENV=staging$(RESET)"; \
		exit 1; \
	fi
	@echo "Deploying to staging..."
	$(DOCKER_COMPOSE) build
	$(DOCKER_COMPOSE) push
	@echo "✨ Deployment to staging complete!"

deploy-prod: ## Docker: Deploy to production environment
	@if [ "$(ENV)" != "production" ]; then \
		echo "$(RED)Error: Must be run with ENV=production$(RESET)"; \
		exit 1; \
	fi
	@echo "Deploying to production..."
	$(DOCKER_COMPOSE) build
	$(DOCKER_COMPOSE) push
	@echo "✨ Deployment to production complete!"

#-----------------------------------------------------------------------------------------------------------------------
# Database (Docker)
#-----------------------------------------------------------------------------------------------------------------------

db-migrate: check-running ## Docker: Run database migrations
	$(DOCKER_COMPOSE) exec api python manage.py migrate

db-makemigrations: check-running ## Docker: Create database migrations
	$(DOCKER_COMPOSE) exec api python manage.py makemigrations

db-backup: check-running ## Docker: Backup database
	@echo "Creating database backup..."
	@mkdir -p backups
	@$(DOCKER_COMPOSE) exec -T db mysqldump -u elfai -pelfai elfai > backups/$(shell date +%Y%m%d_%H%M%S).sql || { echo "$(RED)Database backup failed$(RESET)"; exit 1; }
	@echo "✨ Backup created in backups/"

db-restore: check-running ## Docker: Restore database from backup
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)Error: Please specify the backup file with FILE=<path>$(RESET)"; \
		exit 1; \
	fi
	@if [ ! -f "$(FILE)" ]; then \
		echo "$(RED)Error: Backup file $(FILE) not found$(RESET)"; \
		exit 1; \
	fi
	@echo "Restoring database from $(FILE)..."
	@$(DOCKER_COMPOSE) exec -T db mysql -u elfai -pelfai elfai < $(FILE) || { echo "$(RED)Database restore failed$(RESET)"; exit 1; }
	@echo "✨ Database restored successfully!"

db-shell: check-running ## Docker: Open database shell
	$(DOCKER_COMPOSE) exec db mysql -u elfai -pelfai elfai

#-----------------------------------------------------------------------------------------------------------------------
# Performance (Docker)
#-----------------------------------------------------------------------------------------------------------------------

profile-api: check-running ## Docker: Profile API performance
	$(DOCKER_COMPOSE) exec api python -m cProfile -o profile.stats manage.py runserver

profile-web: check-running ## Docker: Profile web performance
	$(DOCKER_COMPOSE) exec web sh -c "npm run build && npx lighthouse http://localhost:3000 --output-path=reports/lighthouse-report.html"

#-----------------------------------------------------------------------------------------------------------------------
# Cleanup (Docker)
#-----------------------------------------------------------------------------------------------------------------------

clean: ## Docker: Clean up containers and generated files
	$(DOCKER_COMPOSE) down -v
	rm -rf apps/api/**/__pycache__
	rm -rf apps/client/web/dist
	rm -rf .pytest_cache
	rm -rf .coverage
	rm -rf htmlcov
	rm -rf apps/api/docs/build
	rm -rf apps/api/profile.stats
	rm -rf apps/client/web/reports
	rm -rf backups/*

prune: ## Docker: Remove all unused containers, networks, and images
	docker system prune -af

#-----------------------------------------------------------------------------------------------------------------------
# Utility Functions
#-----------------------------------------------------------------------------------------------------------------------

check-env:
	@if [ "$(REQUIRE_ENV_FILE)" = "true" ] && [ ! -f .env ]; then \
		echo "$(RED)Error: .env file not found. Run 'make setup' first.$(RESET)"; \
		echo "$(YELLOW)Note: .env file is required for $(ENV) environment$(RESET)"; \
		exit 1; \
	fi

check-running:
	@if [ -z "$$(docker compose ps -q)" ]; then \
		echo "$(RED)Error: Docker containers are not running. Run 'make dev' first.$(RESET)"; \
		exit 1; \
	fi

#-----------------------------------------------------------------------------------------------------------------------
# Django Extensions (Docker)
#-----------------------------------------------------------------------------------------------------------------------

shell-plus: check-running ## Django Extensions: Run enhanced Django shell with auto-imports
	$(DOCKER_COMPOSE) exec api python manage.py shell_plus

show-urls: check-running ## Django Extensions: Show all URLs in the project
	$(DOCKER_COMPOSE) exec api python manage.py show_urls

graph-models: check-running ## Django Extensions: Generate model diagram (requires graphviz)
	@echo "Generating model diagram..."
	@$(DOCKER_COMPOSE) exec -T api sh -c "python manage.py graph_models -a -o media/models.png" || { echo "$(RED)Model diagram generation failed$(RESET)"; exit 1; }
	@echo "✨ Model diagram generated at media/models.png"

validate-templates: check-running ## Django Extensions: Validate template syntax
	$(DOCKER_COMPOSE) exec api python manage.py validate_templates

list-model-info: check-running ## Django Extensions: List all models and their fields
	$(DOCKER_COMPOSE) exec api python manage.py list_model_info

down: ## Docker: Stop all containers
	$(DOCKER_COMPOSE) down 