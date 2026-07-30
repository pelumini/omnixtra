#!/bin/sh
set -eu

create_role_if_missing() {
  role_name="$1"
  role_password="$2"
  bypass_rls="$3"

  if psql \
    --username "$POSTGRES_USER" \
    --dbname "$POSTGRES_DB" \
    --tuples-only \
    --command "SELECT 1 FROM pg_roles WHERE rolname = '$role_name'" |
    grep -q 1; then
    escaped_password=$(printf "%s" "$role_password" | sed "s/'/''/g")
    psql \
      --username "$POSTGRES_USER" \
      --dbname "$POSTGRES_DB" \
      --command "ALTER ROLE $role_name PASSWORD '$escaped_password'"
    return 0
  fi

  escaped_password=$(printf "%s" "$role_password" | sed "s/'/''/g")
  psql \
    --username "$POSTGRES_USER" \
    --dbname "$POSTGRES_DB" \
    --command "CREATE ROLE $role_name LOGIN PASSWORD '$escaped_password' $bypass_rls"
}

create_role_if_missing "omnixtra_app" "$OMNIXTRA_APP_PASSWORD" "NOBYPASSRLS"
create_role_if_missing "omnixtra_migrations" "$OMNIXTRA_MIGRATIONS_PASSWORD" "NOBYPASSRLS"
create_role_if_missing "omnixtra_superadmin" "$OMNIXTRA_SUPERADMIN_PASSWORD" "BYPASSRLS"

psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
CREATE EXTENSION IF NOT EXISTS vector;
GRANT CONNECT ON DATABASE omnixtra TO omnixtra_app, omnixtra_migrations, omnixtra_superadmin;
GRANT CREATE, USAGE ON SCHEMA public TO omnixtra_migrations;
GRANT USAGE ON SCHEMA public TO omnixtra_app, omnixtra_superadmin;
SQL
