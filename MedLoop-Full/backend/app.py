"""
MedLoop Backend API
====================
Bu dosya iki şeyi bir arada barındırır:

  1) OCR/barkod/karekod tarama servisi (DEĞİŞTİRİLMEDİ):
     medloop_ocr_demo.py içindeki mantığı POST /scan endpoint'ine sarmalar.
     Frontend (React/Vite) ScanScreen.jsx'te çektiği fotoğrafı base64 "data
     URL" formatında bu endpoint'e yollar.

  2) Bildirim sistemi backend'i (YENİ):
     Kullanıcı hesapları (auth), ilaç kayıtları (medications), uygulama içi
     + push bildirimler (notifications) ve puan sistemi. Kod, okunabilirlik
     için ayrı modüllere/blueprint'lere bölündü:
       - config.py            : ayarlar (env değişkenleri)
       - extensions.py        : db / jwt / migrate / scheduler singleton'ları
       - models.py             : User, Medication, Notification, DeviceToken
       - auth/routes.py        : POST /auth/register, /auth/login, GET /auth/me
       - medications/routes.py : ilaç CRUD + POST /medications/<id>/deliver
       - notifications/routes.py : bildirim listesi/okundu işaretleme
       - users/routes.py       : profil + push cihaz token kaydı
       - services/notify.py    : bildirim oluşturma (DB + push tetikleme)
       - services/push.py      : Firebase Cloud Messaging gönderim sarmalayıcısı
       - services/points.py    : puan hesaplama
       - scheduler_jobs.py     : günlük SKT (son kullanma tarihi) kontrol job'ı

Çalıştırma (yerel geliştirme):
  cd backend
  pip install -r requirements.txt
  cp .env.example .env   # gerekirse değerleri düzenle
  python app.py
  -> http://localhost:5000 adresinde ayağa kalkar
  -> İlk çalıştırmada tablolar otomatik oluşturulur (db.create_all()).
     Production'da bunun yerine flask-migrate migration'ları kullanılmalı
     (bkz. README/.env.example).
"""

import base64
import gc
import io
import logging
import re
import sys
import tempfile
import time
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()  # .env dosyası varsa (yerel geliştirme) env değişkenlerini yükle

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

from config import Config
from extensions import db, jwt, migrate

# medloop_ocr_demo.py aynı klasörde olduğu için doğrudan import edilebilir.
from medloop_ocr_demo import run as run_ocr_pipeline

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
app.config.from_object(Config)

# Geliştirme aşamasında Vite dev server'ının (genelde localhost:5173) bu API'ye
# istek atabilmesi için CORS'u tüm origin'lere açıyoruz. Prod'da bunu daraltın
# (bkz. CORS_ORIGINS env değişkeni / config.py).
CORS(app, origins=app.config.get("CORS_ORIGINS", "*"))

# --- Uzantıları bağla ---
db.init_app(app)
jwt.init_app(app)
migrate.init_app(app, db)

# --- Bildirim sistemi blueprint'lerini kaydet ---
from auth.routes import auth_bp
from medications.routes import medications_bp
from notifications.routes import notifications_bp
from users.routes import users_bp

app.register_blueprint(auth_bp)
app.register_blueprint(medications_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(users_bp)


# ============================================================
# OCR / Barkod / Karekod tarama (mevcut mantık - değiştirilmedi)
# ============================================================


def turkish_form_to_frontend(form_raw: str | None) -> str:
    """Backend 'tablet', 'kapsül' gibi küçük harf döndürür; frontend'in
    FORM_OPTIONS listesi 'Tablet', 'Kapsül' gibi büyük harfle başlıyor."""
    mapping = {
        "tablet": "Tablet",
        "film tablet": "Tablet",
        "film kaplı tablet": "Tablet",
        "enterik tablet": "Tablet",
        "kapsül": "Kapsül",
        "şurup": "Şurup",
        "krem": "Merhem",
        "merhem": "Merhem",
        "jel": "Merhem",
        "ampul": "İğne",
        "damla": "Damla",
        "sprey": "Damla",
        "flakon": "İğne",
        "süspansiyon": "Şurup",
    }
    if not form_raw:
        return "Tablet"
    return mapping.get(form_raw.lower(), "Tablet")


def gs1_date_to_iso(skt: str | None) -> str:
    """Backend SKT'yi 'GG.AA.YYYY' döndürüyor (örn '18.03.2027').
    Frontend'deki <input type="date"> alanı 'YYYY-MM-DD' bekler."""
    if not skt:
        return ""
    m = re.match(r"^(\d{2})\.(\d{2})\.(\d{4})$", skt)
    if m:
        dd, mm, yyyy = m.groups()
        return f"{yyyy}-{mm}-{dd}"
    return ""


def split_name_and_dosage(ilac_adi_tahmini: str | None) -> tuple[str, str]:
    """OCR çoğu zaman 'AMOKSISILIN 500 mg' gibi dozu isme yapışık döndürür.
    Formda isim ve doz ayrı alanlar olduğu için burada ayırıyoruz."""
    if not ilac_adi_tahmini:
        return "", ""
    m = re.search(r"^(.*?)\s*(\d{1,4}\s?mg)\s*$", ilac_adi_tahmini.strip(), re.IGNORECASE)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return ilac_adi_tahmini.strip(), ""


@app.route("/scan", methods=["POST"])
def scan():
    payload = request.get_json(silent=True) or {}
    image_data_url = payload.get("image")
    if not image_data_url:
        return jsonify({"error": "image alanı zorunlu"}), 400

    # "data:image/jpeg;base64,XXXX" formatından sadece base64 kısmını ayıkla
    if "," in image_data_url:
        header, b64data = image_data_url.split(",", 1)
    else:
        b64data = image_data_url

    try:
        image_bytes = base64.b64decode(b64data)
    except Exception:
        return jsonify({"error": "Görsel çözümlenemedi (geçersiz base64)"}), 400

    # Büyük telefon fotoğraflarını küçültüyoruz: Render'ın zayıf CPU'sunda
    # her döndürme/büyütme denemesi görsel boyutuyla orantılı yavaşlıyor.
    # Karekod/barkod okumak için 1400px yeterli, gereksiz büyük boyut sadece süreyi uzatıyor.
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img = img.convert("RGB")
        max_side = 1000
        if max(img.size) > max_side:
            ratio = max_side / max(img.size)
            new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
            img = img.resize(new_size, Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=88)
        image_bytes = buf.getvalue()
    except Exception:
        pass  # küçültme başarısız olursa orijinal görselle devam et

    # medloop_ocr_demo.run() bir dosya yolu beklediği için geçici dosyaya yazıyoruz.
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name

    try:
        t0 = time.time()
        raw_result = run_ocr_pipeline(tmp_path)
        elapsed = time.time() - t0
        print(f"[TIMING] run_ocr_pipeline: {elapsed:.2f}s", file=sys.stderr, flush=True)
    except Exception as e:
        return jsonify({"error": f"OCR işlenemedi: {e}"}), 500
    finally:
        Path(tmp_path).unlink(missing_ok=True)
        # Render'ın ücretsiz planında RAM çok sınırlı (512MB); tek worker
        # birden fazla isteği art arda işlediği için, her istekten sonra
        # büyük görüntü nesnelerini bellekten açıkça düşürüyoruz.
        del image_bytes
        gc.collect()

    name, dosage = split_name_and_dosage(raw_result.get("ilac_adi_tahmini"))

    # Frontend'in AddMedicineScreen.jsx'te beklediği tam şekil:
    # { name, dosage, form, quantity, batchNo, expiryDate }
    response = {
        "name": name,
        "dosage": dosage,
        "form": turkish_form_to_frontend(raw_result.get("farmasotik_form")),
        "quantity": 1,  # OCR/karekod adet bilgisi vermez; kullanıcı formda düzeltir
        "batchNo": raw_result.get("parti_no") or "",
        "expiryDate": gs1_date_to_iso(raw_result.get("skt")),
        # Debug/geliştirme için ham veriyi de ekliyoruz, frontend kullanmak zorunda değil
        "_raw": raw_result,
    }
    return jsonify(response)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


# ============================================================
# CLI komutları (manuel test/yönetim için)
# ============================================================


@app.cli.command("create-db")
def create_db():
    """Tabloları oluşturur (migration kullanmıyorsan hızlı başlangıç için).
    Kullanım: flask --app app.py create-db"""
    with app.app_context():
        db.create_all()
    print("Tablolar oluşturuldu.")


@app.cli.command("check-expiry")
def check_expiry_command():
    """SKT kontrol job'ını elle (zamanlayıcı beklemeden) tetikler - test için.
    Kullanım: flask --app app.py check-expiry"""
    from scheduler_jobs import check_expiring_medications

    check_expiring_medications(app)
    print("SKT kontrolü tamamlandı.")


# ============================================================
# Uygulama başlangıcı
# ============================================================

# Geliştirmede (SQLite fallback) tabloların var olduğundan emin ol.
# Production'da (DATABASE_URL = PostgreSQL) bunun yerine `flask db upgrade`
# ile migration çalıştırmak tercih edilmeli; ama create_all() zaten var olan
# tabloları değiştirmediği için burada bırakılması zararsız bir güvenlik ağı.
with app.app_context():
    db.create_all()

from scheduler_jobs import start_scheduler

start_scheduler(app)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
