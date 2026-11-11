#!/usr/bin/env bash
set -e

# ==============================================================================
# VedaTax Website Deployment Script (Google Cloud Run)
# ==============================================================================

PROJECT_ID="${GCP_PROJECT_ID:-clear-doctor}"
REGION="${GCP_REGION:-europe-west1}"
SERVICE_NAME="${SERVICE_NAME:-vedatax-website}"
IMAGE_TAG="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Ensure gcloud is in PATH
export PATH="/opt/homebrew/bin:/opt/homebrew/share/google-cloud-sdk/bin:$PATH"

echo "=========================================================="
echo " Starting VedaTax Website Deployment"
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

echo "==> Ensuring required Google Cloud APIs are enabled..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    artifactregistry.googleapis.com

# Navigate to frontend directory
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT/frontend"

echo "==> Submitting build to Google Cloud Build (Tag: $IMAGE_TAG)..."
gcloud builds submit --tag "$IMAGE_TAG"

echo "==> Deploying service '$SERVICE_NAME' to Cloud Run ($REGION)..."
gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_TAG" \
    --region "$REGION" \
    --allow-unauthenticated

echo ""
echo "=========================================================="
echo " Website successfully deployed!"
gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)'
echo "=========================================================="
