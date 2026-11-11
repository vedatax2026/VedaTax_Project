# ==============================================================================
# VedaTax API (Backend) - Multi-Stage Dockerfile
# ==============================================================================

# Stage 1: Build & Publish the .NET 8 Web API
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project definitions first to cache NuGet dependencies
COPY VedaTax.sln ./
COPY VedaTax.Api/VedaTax.Api.csproj VedaTax.Api/

# Restore dependencies
RUN dotnet restore VedaTax.sln

# Copy the rest of the backend codebase
COPY . .

# Build and publish in Release mode
WORKDIR /src/VedaTax.Api
RUN dotnet publish VedaTax.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore \
    /p:UseAppHost=false

# Stage 2: Minimal Production ASP.NET Core Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Install curl for container health check
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Pre-create the upload folder and ensure non-root 'app' user has write permissions
RUN mkdir -p /app/App_Data/uploads \
    && chown -R app:app /app

# Copy compiled binaries from the build stage with proper user permissions
COPY --from=build --chown=app:app /app/publish .

# Configure ASP.NET Core container environment
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true

# Expose HTTP port
EXPOSE 8080

# Run as non-root user (built into official .NET 8 images for security)
USER app

# Health check using the backend's /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl --fail http://localhost:8080/api/health || exit 1

ENTRYPOINT ["dotnet", "VedaTax.Api.dll"]
