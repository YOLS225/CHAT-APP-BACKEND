
up:
	docker compose -f compose.yaml -p chat-backend up -d

down:
	docker compose -f compose.yaml -p chat-backend down \
	&& docker compose rm -fsv \
	&& docker volume rm chat-backend_postgres_data

reset: down up


