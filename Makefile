.PHONY: dev down clean

# Development (uses .env.example)
dev:
	docker compose --env-file .env.example down
	docker compose --env-file .env.example up

test:
	docker compose --env-file .env.example build backend
	docker compose --env-file .env.example run backend pytest


# Stop all containers
down:
	docker compose down

# Clean up all containers and volumes
clean:
	docker compose down -v 