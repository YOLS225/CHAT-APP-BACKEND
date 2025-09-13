
up:
	docker compose -f compose.yaml -p digi-cim up -d

down:
	docker compose -f compose.yaml -p digi-cim down \
	&& docker compose rm -fsv \
	&& docker volume rm digi-cim_postgres_data

reset: down up


