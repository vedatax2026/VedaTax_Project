#!/usr/bin/env bash
set -e

# ==============================================================================
# VedaTax Backend API Deployment Script (Google Cloud Run)
# ==============================================================================

PROJECT_ID="${GCP_PROJECT_ID:-clear-doctor}"
REGION="${GCP_REGION:-europe-west1}"
SERVICE_NAME="${SERVICE_NAME:-vedatax-api}"
IMAGE_TAG="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Ensure gcloud is in PATH
export PATH="/opt/homebrew/bin:/opt/homebrew/share/google-cloud-sdk/bin:$PATH"

echo "=========================================================="
echo " Starting VedaTax Backend API Deployment"
echo " Project: $PROJECT_ID | Region: $REGION"
echo "=========================================================="

# Check if logged in
if ! gcloud auth print-access-token >/dev/null 2>&1; then
    echo "Error: Not authenticated with gcloud."
    echo "Please run: gcloud auth login"
    exit 1
fi

echo "==> Setting active project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"

# Navigate to backend directory
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT/backend"

echo "==> Submitting build to Google Cloud Build (Tag: $IMAGE_TAG)..."
gcloud builds submit --tag "$IMAGE_TAG"

# Default JWT Key if not provided (must be at least 32 characters)
JWT_KEY="${JWT_KEY:-vedatax-production-secret-signing-key-2026-min32chars}"
WEBSITE_ORIGIN="${WEBSITE_ORIGIN:-https://my-website-service-1054434301459.europe-west1.run.app}"

ENV_VARS="Jwt__Key=${JWT_KEY},Cors__Origins__0=${WEBSITE_ORIGIN}"

if [ -n "$DB_CONNECTION_STRING" ]; then
    ENV_VARS="${ENV_VARS},ConnectionStrings__Default=${DB_CONNECTION_STRING}"
elif [ -n "$ConnectionStrings__Default" ]; then
    ENV_VARS="${ENV_VARS},ConnectionStrings__Default=${ConnectionStrings__Default}"
else
    echo "----------------------------------------------------------"
    echo "WARNING: No DB_CONNECTION_STRING specified."
    echo "The .NET API requires a PostgreSQL connection string to start."
    echo "Set DB_CONNECTION_STRING=\"Host=...;Database=vedatax;Username=...;Password=...\""
    echo "----------------------------------------------------------"
fi

echo "==> Deploying service '$SERVICE_NAME' to Cloud Run ($REGION)..."
gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_TAG" \
    --region "$REGION" \
    --allow-unauthenticated \
    --set-env-vars "$ENV_VARS"

echo ""
echo "=========================================================="
echo " API successfully deployed!"
gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)'
echo "=========================================================="
