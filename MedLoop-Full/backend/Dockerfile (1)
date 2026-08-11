FROM python:3.11-slim

# Sistem bağımlılıkları: Tesseract (Türkçe dahil), zbar, libdmtx
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-tur \
    libzbar0 \
    libdmtx0b \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn

COPY . .

# Render, PORT ortam değişkenini otomatik sağlar; gunicorn onu dinlemeli
CMD gunicorn --bind 0.0.0.0:$PORT --timeout 180 --workers 1 app:app
