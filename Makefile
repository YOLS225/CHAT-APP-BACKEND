
IMAGE = yols225/chat_backend
TAG = latest

build:
	docker compose -f compose.yaml -p chat-backend up -d --build

up:
	docker compose -f compose.yaml -p chat-backend up -d

down:
	docker compose -f compose.yaml -p chat-backend down \
	&& docker compose rm -fsv \
	&& docker volume rm chat-backend_postgres_data minio_data

reset: down build

push:
	docker buildx build --platform linux/amd64 -t $(IMAGE):$(TAG) --push .

