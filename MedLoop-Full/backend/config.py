"""
MedLoop Backend - Konfigürasyon
================================
Tüm ayarlar environment variable'lardan okunur (12-factor app pratiği).
Yerel geliştirmede bir .env dosyası kullanabilirsin (python-dotenv ile
otomatik yüklenir, bkz. app.py). Production'da (Render, Docker, vs.)
bu değişkenleri platform üzerinden tanımla.

Bkz. .env.example dosyası için gerekli tüm değişkenlerin listesi.
"""

import os
from datetime import timedelta


def _database_url() -> str:
    """DATABASE_URL env değişkeni varsa onu kullanır (production'da PostgreSQL
    için bu şekilde ayarlanmalı, örn:
    postgresql://user:password@host:5432/medloop).

    Tanımlı değilse, yerelde kurulum gerektirmeden çalışabilmek için
    proje klasöründe bir SQLite dosyasına düşer. Bu SADECE geliştirme
    içindir; production'da mutlaka DATABASE_URL ayarlanmalı."""
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url:
        base_dir = os.path.abspath(os.path.dirname(__file__))
        return f"sqlite:///{os.path.join(base_dir, 'medloop_dev.db')}"
    # Render/Heroku gibi platformlar bazen "postgres://" ile başlayan URL
    # verir; SQLAlchemy 1.4+ "postgresql://" bekler.
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


class Config:
    # --- Veritabanı ---
    SQLALCHEMY_DATABASE_URI = _database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- JWT / Auth ---
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-secret-degistir-bunu")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        days=int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES_DAYS", "30"))
    )

    # --- İş kuralları ---
    # Son kullanma tarihine kaç gün kala uyarı gönderilsin (varsayılan 7 gün / 1 hafta)
    EXPIRY_WARNING_DAYS_BEFORE = int(os.environ.get("EXPIRY_WARNING_DAYS_BEFORE", "7"))
    # Eczaneye teslim edilen ilaç başına kazanılan puan
    POINTS_PER_DELIVERY = int(os.environ.get("POINTS_PER_DELIVERY", "10"))

    # --- Zamanlanmış görev (SKT kontrolü) ---
    # Varsayılan: her gün 09:00'da çalışır (sunucu saat dilimine göre).
    SCHEDULER_HOUR = int(os.environ.get("SCHEDULER_HOUR", "9"))
    SCHEDULER_MINUTE = int(os.environ.get("SCHEDULER_MINUTE", "0"))
    # Testte/geliştirmede zamanlayıcıyı tamamen kapatmak için "false" yapılabilir.
    ENABLE_SCHEDULER = os.environ.get("ENABLE_SCHEDULER", "true").lower() == "true"

    # --- Firebase Cloud Messaging (push notification) ---
    # Service account JSON dosyasının yolu. Ayarlanmazsa push gönderimi
    # sessizce no-op olur (sadece log basar), uygulama içi bildirimler
    # yine de normal şekilde çalışmaya devam eder.
    FIREBASE_CREDENTIALS_PATH = os.environ.get("FIREBASE_CREDENTIALS_PATH", "").strip()

    # --- CORS ---
    # Prod'da bunu frontend domain'inle sınırlamak isteyebilirsin.
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")
