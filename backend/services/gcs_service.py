"""
LegalEase AI – Google Cloud Storage Service
Handles persistent storage of PDF reports and user uploads in a production (Google Cloud) environment.
Toggle via GCS_ENABLED=true in backend/.env.
"""

import os
import logging
from typing import Optional

try:
    from google.cloud import storage
    GCS_AVAILABLE = True
except ImportError:
    GCS_AVAILABLE = False

logger = logging.getLogger(__name__)

# Settings from environment
GCS_ENABLED = os.getenv("GCS_ENABLED", "false").lower() == "true"
BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "legalease-reports")

def upload_to_gcs(local_file_path: str, destination_blob_name: str) -> Optional[str]:
    """
    Uploads a file to the bucket.
    Returns the public/internal URI or None if failed/disabled.
    """
    if not GCS_ENABLED or not GCS_AVAILABLE:
        logger.info(f"GCS disabled or library missing. Skipping upload for {destination_blob_name}")
        return None

    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(destination_blob_name)

        blob.upload_from_filename(local_file_path)
        
        # Use gcs URI or construct signed URL if needed. 
        # For simplicity in evaluation, we return the gs:// path
        uri = f"gs://{BUCKET_NAME}/{destination_blob_name}"
        logger.info(f"File {local_file_path} uploaded to {uri}")
        return uri
    except Exception as e:
        logger.error(f"Failed to upload to GCS: {e}")
        return None

def download_from_gcs(blob_name: str, local_destination_path: str) -> bool:
    """Downloads a blob from the bucket."""
    if not GCS_ENABLED or not GCS_AVAILABLE:
        return False

    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(blob_name)
        blob.download_to_filename(local_destination_path)
        return True
    except Exception as e:
        logger.error(f"Failed to download from GCS: {e}")
        return False
