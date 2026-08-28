#!/bin/bash
set -euxo pipefail

dnf update -y
dnf install -y docker unzip

systemctl enable docker
systemctl start docker

mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
unzip -q /tmp/awscliv2.zip -d /tmp
/tmp/aws/install
rm -rf /tmp/awscliv2.zip /tmp/aws

aws ecr get-login-password --region ${aws_region} | \
  docker login --username AWS --password-stdin ${ecr_repository_url}

mkdir -p /opt/${app_name}
cat > /opt/${app_name}/docker-compose.yml <<'COMPOSE'
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${postgres_user}
      POSTGRES_PASSWORD: ${postgres_password}
      POSTGRES_DB: ${postgres_db}
    volumes: ["pgdata:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${postgres_user}"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  api:
    image: ${ecr_repository_url}:${ecr_image_tag}
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://${postgres_user}:${postgres_password}@postgres:5432/${postgres_db}?schema=public
      JWT_EXPIRES_IN: ${jwt_expires_in}
      JWT_SECRET: ${jwt_secret}
      REDIS_URL: redis://redis:6379
    ports: ["${http_port}:${app_port}"]
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  pgdata:
COMPOSE

cd /opt/${app_name}
docker compose up -d
