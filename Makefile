.PHONY: build run stop logs clean help

# Variables
IMAGE_NAME = temperature-monitor
CONTAINER_NAME = temperature-monitor
PORT = 3000

help:
	@echo "Available commands:"
	@echo "  make build    - Build the Docker image"
	@echo "  make run      - Run the container (builds if image doesn't exist)"
	@echo "  make stop     - Stop and remove the container"
	@echo "  make logs     - Show container logs"
	@echo "  make clean    - Stop container and remove image"
	@echo "  make restart  - Restart the container"

build:
	docker-compose build

run:
	docker-compose up -d

stop:
	docker-compose down

logs:
	docker-compose logs -f

clean: stop
	docker-compose down --rmi all
	docker system prune -f

restart: stop run

# Development commands
dev:
	npm install
	node server.js 