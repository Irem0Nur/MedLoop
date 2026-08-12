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
#
# ÖNEMLİ: --workers 1 bilinçli tercih. scheduler_jobs.py içindeki APScheduler
# her worker process'inde ayrı başlar; workers > 1 yaparsan SKT kontrol job'ı
# birden fazla kez tetiklenir (DB'deki notified_*_sent flag'leri sayesinde
# bildirim yine de tekrar gönderilmez, ama gereksiz DB sorgusu/log oluşur).
# Ölçeklendirmek istersen scheduler'ı ayrı bir worker/servise taşı
# (ENABLE_SCHEDULER=false ile web worker'larında kapatıp ayrı bir "worker"
# process'inde ENABLE_SCHEDULER=true ile tek başına çalıştırmak gibi).
CMD gunicorn --bind 0.0.0.0:$PORT --timeout 180 --workers 1 --access-logfile - --error-logfile - app:app
