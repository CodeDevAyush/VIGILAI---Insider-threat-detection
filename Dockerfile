FROM python:3.10-slim

WORKDIR /app

# Copy requirement files first
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY agents/ agents/
COPY api/ api/
COPY pipeline.py generate_test_data.py recheck_pipeline.py ./

# Expose backend port
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
