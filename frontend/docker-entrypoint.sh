#!/bin/sh
set -e

# Adapt Nginx listen port if PORT env variable is provided (e.g. Cloud Run defaults to 8080)
PORT="${PORT:-80}"
echo "[VedaTax Web] Configuring Nginx to listen on port ${PORT}..."
sed -i "s/listen [0-9]*/listen ${PORT}/g" /etc/nginx/conf.d/default.conf

# If BACKEND_URL is specified (e.g. http://api:8080 or https://api-xxx.a.run.app),
# write the /api reverse proxy configuration file.
if [ -n "$BACKEND_URL" ]; then
    echo "[VedaTax Web] BACKEND_URL configured as '$BACKEND_URL'. Activating /api reverse proxy..."
    cat <<EOF > /etc/nginx/conf.d/api-proxy.inc
# Auto-generated reverse proxy for backend API
location /api/ {
    proxy_pass ${BACKEND_URL};
    proxy_http_version 1.1;
    proxy_ssl_server_name on;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$proxy_host;
    proxy_cache_bypass \$http_upgrade;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    client_max_body_size 25M;
    proxy_read_timeout 300s;
    proxy_connect_timeout 60s;
}
EOF
else
    echo "[VedaTax Web] No BACKEND_URL specified. Running in standalone static SPA mode."
    rm -f /etc/nginx/conf.d/api-proxy.inc
fi

exec "$@"
