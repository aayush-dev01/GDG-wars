# Use official Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (needed for PDF/QR generation)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Create directories for reports and uploads
RUN mkdir -p generated_reports uploaded_documents

# Expose the port (Cloud Run uses 8080 by default)
EXPOSE 8080

# Run the application
# We use $PORT provided by Cloud Run
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
