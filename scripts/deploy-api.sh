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

# Default Cloud SQL connection & JWT Key
CLOUDSQL_INSTANCE="${CLOUDSQL_INSTANCE:-clear-doctor:asia-south1:vedatax-db}"
DEFAULT_DB_CONN="Host=/cloudsql/${CLOUDSQL_INSTANCE};Port=5432;Database=vedatax;Username=postgres;Password=VedaTax-db1"
DB_CONNECTION_STRING="${DB_CONNECTION_STRING:-$DEFAULT_DB_CONN}"
JWT_KEY="${JWT_KEY:-vedatax-production-secret-signing-key-2026-min32chars}"
WEBSITE_ORIGIN_1="${WEBSITE_ORIGIN:-https://vedatax-website-1054434301459.europe-west1.run.app}"
WEBSITE_ORIGIN_2="https://my-website-service-1054434301459.europe-west1.run.app"

ENV_VARS="Jwt__Key=${JWT_KEY},Cors__Origins__0=${WEBSITE_ORIGIN_1},Cors__Origins__1=${WEBSITE_ORIGIN_2},ConnectionStrings__Default=${DB_CONNECTION_STRING}"

echo "==> Deploying service '$SERVICE_NAME' to Cloud Run ($REGION)..."
gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_TAG" \
    --region "$REGION" \
    --allow-unauthenticated \
    --add-cloudsql-instances "$CLOUDSQL_INSTANCE" \
    --set-env-vars "$ENV_VARS"

echo ""
echo "=========================================================="
echo " API successfully deployed!"
gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)'
echo "=========================================================="
