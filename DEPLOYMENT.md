# VedaTax Docker & Deployment Guide

This repository contains fully separated, production-ready Docker configurations for both the **Website (Frontend)** and the **API (Backend)**. Each service can be built, tested, and deployed completely independently to different cloud services or container registries without mutual dependencies or build conflicts.

---

## Architecture Overview

```
                                      +------------------------------------+
                                      |          Web Browser               |
                                      +-----------------+------------------+
                                                        |
                            +---------------------------+---------------------------+
                            | (HTTP/S)                                              | (API calls)
                            v                                                       v
            +-------------------------------+                       +-------------------------------+
            |    VedaTax Website (SPA)      |                       |         VedaTax API           |
            |       Container: Port 80      |                       |     Container: Port 8080      |
            |                               |                       |                               |
            | - Vite + React 18 production  |                       | - ASP.NET Core 8 Web API      |
            | - Nginx 1.27 Alpine runtime   |                       | - Non-root 'app' user         |
            | - SPA HTML5 routing fallback  |                       | - Built-in health check       |
            | - Gzip compression & security |                       | - Storage: /app/App_Data/     |
            | - Optional reverse proxy mode |                       +---------------+---------------+
            +-------------------------------+                                       |
                                                                                    v
                                                                    +-------------------------------+
                                                                    |      PostgreSQL Database      |
                                                                    |           Port 5432           |
                                                                    +-------------------------------+
```

---

## 1. Website (Frontend) Container

- **Source directory**: `frontend/`
- **Base image**: `node:20-alpine` (builder) &rarr; `nginx:1.27-alpine` (production runtime)
- **Port exposed**: `80`
- **Health check**: `http://localhost:80/healthz`
- **Ignored paths**: `frontend/.dockerignore` excludes `node_modules`, `dist`, local `.env` files, logs, etc.

### Building the Website Image

```bash
cd frontend
docker build -t vedatax-website:latest .
```

*Or from the root directory:*
```bash
docker build -f frontend/Dockerfile -t vedatax-website:latest frontend
```

### Build Arguments & Environment Variables

| Variable / Arg | Type | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | Build Arg | `""` | The URL of the deployed backend (e.g., `https://api.vedatax.com`). If empty, relative path `/api` is used. |
| `BACKEND_URL` | Runtime Env | `""` | When set (e.g., `http://api:8080`), Nginx will automatically reverse-proxy all `/api/*` traffic to this host. |

#### Example: Building for a Separate API Domain
If your API is hosted at `https://api.vedatax.com`:
```bash
cd frontend
docker build \
  --build-arg VITE_API_BASE_URL=https://api.vedatax.com \
  -t vedatax-website:latest .
```

### Running the Website Container Standalone

```bash
docker run -d \
  --name vedatax-web \
  -p 80:80 \
  vedatax-website:latest
```

---

## 2. API (Backend) Container

- **Source directory**: `backend/`
- **Base image**: `mcr.microsoft.com/dotnet/sdk:8.0` (builder) &rarr; `mcr.microsoft.com/dotnet/aspnet:8.0` (runtime)
- **Port exposed**: `8080`
- **Health check**: `http://localhost:8080/api/health`
- **Security**: Runs as the non-root `app` user (UID 1654)
- **Ignored paths**: `backend/.dockerignore` excludes `bin/`, `obj/`, `.vs/`, uploads, logs, etc.

### Building the API Image

```bash
cd backend
docker build -t vedatax-api:latest .
```

*Or from the root directory:*
```bash
docker build -f backend/Dockerfile -t vedatax-api:latest backend
```

### Environment Variables

| Variable | Required | Description | Example |
|---|---|---|---|
| `ConnectionStrings__Default` | **Yes** | PostgreSQL connection string | `Host=db;Port=5432;Database=vedatax;Username=postgres;Password=secret` |
| `Jwt__Key` | **Yes** | Signing key (must be $\ge$ 32 chars) | `your-secure-32-char-min-jwt-secret-key-123` |
| `Cors__Origins__0` | **Yes** | Allowed website origin | `https://vedatax.com` |
| `Cors__Origins__1` | Optional | Additional allowed origin | `http://localhost:80` |
| `Storage__UploadsPath` | Optional | Upload storage directory | `App_Data/uploads` (default) |
| `ASPNETCORE_ENVIRONMENT` | Optional | Runtime environment | `Production` (default) or `Development` |

### Running the API Container Standalone

```bash
docker run -d \
  --name vedatax-api \
  -p 5080:8080 \
  -e ConnectionStrings__Default="Host=my-postgres-host;Port=5432;Database=vedatax;Username=postgres;Password=mypassword" \
  -e Jwt__Key="super-secret-jwt-signing-key-at-least-32-chars-long" \
  -e Cors__Origins__0="https://vedatax.com" \
  -v vedatax_uploads:/app/App_Data/uploads \
  vedatax-api:latest
```

> **Note on Persistent Storage**: Portal client uploads are stored under `/app/App_Data/uploads`. Always mount a volume or persistent disk at this path in production.

---

## 3. Local Full-Stack Deployment with Docker Compose

For local development, staging, or running all services together:

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Start all services (PostgreSQL, Backend API, and Website):
   ```bash
   docker compose up -d
   ```
3. Access the services:
   - **Website**: [http://localhost](http://localhost) (Port 80)
   - **API Health**: [http://localhost:5080/api/health](http://localhost:5080/api/health)
   - **API Swagger (Dev mode)**: [http://localhost:5080/swagger](http://localhost:5080/swagger)
   - **PostgreSQL**: `localhost:5432`

---

## 4. Preventing Deployment & Build Conflicts

We implemented 3-tier `.dockerignore` protection:

1. **`frontend/.dockerignore`**:
   Ensures that only clean source files are uploaded when building the frontend. It ignores `node_modules/`, `dist/`, local `.env` files, and IDE configs.

2. **`backend/.dockerignore`**:
   Ensures that only C# source files and project manifests are uploaded when building the API. It ignores `bin/`, `obj/`, temporary files, and document uploads.

3. **`/.dockerignore` (Root)**:
   Guarantees that if a build context is executed from the repository root (e.g. in automated CI/CD runners), neither frontend artifacts nor backend binaries are transferred across boundaries, keeping image layers lightweight and secure.
