# LegalEase AI - Cloud Run Deployment Script (PowerShell)
$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_ID = "the-axiom-493005-u6"
$REGION = "asia-south1"
$REPO_NAME = "legalease-repo"
$BACKEND_IMAGE = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/legalease-backend"
$FRONTEND_IMAGE = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/legalease-frontend"

Write-Host "🚀 Starting deployment to Google Cloud Run..." -ForegroundColor Cyan

# 1. Enable APIs
Write-Host "Enabling necessary Google Cloud APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com --project $PROJECT_ID

# 2. Build and Push Backend
Write-Host "Building Backend Container..." -ForegroundColor Yellow
Push-Location backend
gcloud builds submit --tag $BACKEND_IMAGE --project $PROJECT_ID
Pop-Location

# Load environment variables from backend/.env if it exists
if (Test-Path "backend/.env") {
    Get-Content "backend/.env" | Where-Object { $_ -match "=" -and $_ -notmatch "^#" } | ForEach-Object {
        $name, $value = $_.Split('=', 2)
        if ($name -and $value) {
            Set-Item -Path "env:$($name.Trim())" -Value $($value.Trim())
        }
    }
}

# 3. Deploy Backend
Write-Host "Deploying Backend to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy legalease-backend `
  --image $BACKEND_IMAGE `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --set-env-vars "CORS_ORIGINS=*,RATE_LIMIT_MAX=100,GEMINI_API_KEY=$($env:GEMINI_API_KEY),GROQ_API_KEY=$($env:GROQ_API_KEY),EMAIL_ENABLED=$($env:EMAIL_ENABLED),SMTP_HOST=$($env:SMTP_HOST),SMTP_PORT=$($env:SMTP_PORT),SMTP_USER=$($env:SMTP_USER),SMTP_PASS=$($env:SMTP_PASS)" `
  --project $PROJECT_ID

# Get the Backend URL
$BACKEND_URL = (gcloud run services describe legalease-backend --platform managed --region $REGION --format 'value(status.url)' --project $PROJECT_ID).Trim()
Write-Host "Backend deployed at: $BACKEND_URL" -ForegroundColor Green

# 4. Build and Push Frontend
Write-Host "Building Frontend Container..." -ForegroundColor Yellow
Push-Location frontend

# Create a temporary cloudbuild.yaml to handle build args
$cbContent = @"
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '-t', '`$_IMAGE', '--build-arg', 'VITE_API_BASE=`$_VITE_API_BASE', '.']
images:
- '`$_IMAGE'
"@
$cbContent | Out-File -FilePath cloudbuild.yaml -Encoding ascii

gcloud builds submit --config cloudbuild.yaml --substitutions "_IMAGE=$FRONTEND_IMAGE,_VITE_API_BASE=$BACKEND_URL" --project $PROJECT_ID
Remove-Item cloudbuild.yaml
Pop-Location

# 5. Deploy Frontend
Write-Host "Deploying Frontend to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy legalease-frontend `
  --image $FRONTEND_IMAGE `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --set-env-vars "VITE_API_BASE=$BACKEND_URL" `
  --project $PROJECT_ID

# Get the Frontend URL
$FRONTEND_URL = (gcloud run services describe legalease-frontend --platform managed --region $REGION --format 'value(status.url)' --project $PROJECT_ID).Trim()

Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "Backend: $BACKEND_URL"
Write-Host "Frontend: $FRONTEND_URL"
Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host "⚠️ IMPORTANT: Cloud Run is stateless. SQLite data will be lost on restarts." -ForegroundColor Red
Write-Host "For production, use Cloud SQL (PostgreSQL) and Cloud Storage (GCS)." -ForegroundColor Red
