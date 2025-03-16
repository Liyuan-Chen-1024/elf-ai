.PHONY: dev build clean install test

# Default target
all: dev

# Start development server
dev:
	docker-compose up

# Build for production
build:
	docker build --target production -t jarvis-web:latest .

# Clean up
clean:
	docker-compose down -v
	rm -rf node_modules

# Install dependencies
install:
	docker-compose run --rm web npm install

# Run tests
test:
	docker-compose run --rm web npm test

# Format code
format:
	docker-compose run --rm web npm run format

# Help
help:
	@echo "Available commands:"
	@echo "  make dev      - Start development server"
	@echo "  make build    - Build for production"
	@echo "  make clean    - Clean up containers and node_modules"
	@echo "  make install  - Install dependencies"
	@echo "  make test     - Run tests"
	@echo "  make format   - Format code" 