# ==============================================================================
# VedaTax Website (Frontend) - Multi-Stage Dockerfile
# ==============================================================================

# Stage 1: Build the Vite + React application
FROM node:20-alpine AS build

WORKDIR /app

# Optional build argument if API is deployed to a separate domain (e.g. https://api.vedatax.com)
# If empty, API calls use relative /api paths (ideal when reverse-proxied or proxied by Nginx)
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Copy dependency manifests first for optimized layer caching
COPY package.json package-lock.json ./

# Clean install dependencies
RUN npm ci

# Copy the rest of the frontend source files
COPY . .

# Build the production bundle into /app/dist
RUN npm run build

# Stage 2: Serve using high-performance Nginx web server
FROM nginx:1.27-alpine AS runtime

# Remove default Nginx welcome pages
RUN rm -rf /usr/share/nginx/html/*

# Copy built production assets from builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration and entrypoint
COPY default.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh

# Ensure entrypoint script is executable
RUN chmod +x /docker-entrypoint.sh

# Expose standard HTTP port
EXPOSE 80

# Health check to ensure Nginx is running and serving traffic
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/healthz || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
