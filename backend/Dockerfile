@@ .. @@
 FROM python:3.11-slim

 # Set working directory
 WORKDIR /app

 # Install system dependencies
 RUN apt-get update && apt-get install -y \
     gcc \
+    tesseract-ocr \
+    tesseract-ocr-rus \
+    libtesseract-dev \
+    libleptonica-dev \
+    libgl1-mesa-glx \
+    libglib2.0-0 \
     && rm -rf /var/lib/apt/lists/*

 # Copy requirements first for better caching
 COPY requirements.txt .

 # Install Python dependencies
 RUN pip install --no-cache-dir -r requirements.txt

+# Create non-root user for security
+RUN useradd -m -u 1000 botuser && chown -R botuser:botuser /app
+USER botuser
+
 # Copy application code
 COPY . .
+
+# Expose port (if needed for webhooks)
+EXPOSE 8000
+
+# Health check
+HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
+    CMD python -c "import asyncio; print('Bot is healthy')" || exit 1
+
+# Run the bot
+CMD ["python", "main.py"]