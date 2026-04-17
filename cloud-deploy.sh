#!/bin/bash

# LegalEase AI - Cloud Run Deployment Script
# This script builds and deploys the backend and frontend to Google Cloud Run.

# Configuration
PROJECT_ID="YOUR_PROJECT_ID"
REGION="asia-south1" # Or your preferred region
BACKEND_IMAGE="gcr.io/$PROJECT_ID/legalease-backend"
FRONTEND_IMAGE="gcr.io/$PROJECT_ID/legalease-frontend"

echo "🚀 Starting deployment to Google Cloud Run..."

# 1. Enable APIs
echo "Enabling necessary Google Cloud APIs..."
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com

# 2. Build and Push Backend
echo "Building Backend Container..."
cd backend
gcloud builds submit --tag $BACKEND_IMAGE
cd ..

# 3. Deploy Backend
echo "Deploying Backend to Cloud Run..."
gcloud run deploy legalease-backend \
  --image $BACKEND_IMAGE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "CORS_ORIGINS=*,RATE_LIMIT_MAX=100"

# Get the Backend URL
BACKEND_URL=$(gcloud run services describe legalease-backend --platform managed --region $REGION --format 'value(status.url)')
echo "Backend deployed at: $BACKEND_URL"

# 4. Build and Push Frontend
echo "Building Frontend Container..."
cd frontend
gcloud builds submit --tag $FRONTEND_IMAGE --build-arg "VITE_API_BASE=$BACKEND_URL"
cd ..

# 5. Deploy Frontend
echo "Deploying Frontend to Cloud Run..."
gcloud run deploy legalease-frontend \
  --image $FRONTEND_IMAGE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "VITE_API_BASE=$BACKEND_URL"

# Get the Frontend URL
FRONTEND_URL=$(gcloud run services describe legalease-frontend --platform managed --region $REGION --format 'value(status.url)')

echo "--------------------------------------------------"
echo "✅ Deployment Complete!"
echo "Backend: $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo "--------------------------------------------------"
echo "⚠️ IMPORTANT: Cloud Run is stateless. SQLite data will be lost on restarts."
echo "For production, use Cloud SQL (PostgreSQL) and Cloud Storage (GCS)."
