"""
MedLoop Backend API
====================
medloop_ocr_demo.py içindeki mevcut OCR/barkod/karekod mantığını DEĞİŞTİRMEDEN
bir web API'sine (Flask) sarmalayan dosya.

Frontend (React/Vite), ScanScreen.jsx'te bir fotoğraf çektiğinde, bu fotoğrafı
base64 "data URL" formatında ( "data:image/jpeg;base64,....." ) POST /scan
endpoint'ine yollar. Bu dosya:
  1) Gelen base64 veriyi geçici bir dosyaya yazar
  2) medloop_ocr_demo.py'deki run() fonksiyonunu (hiç dokunmadan) çağırır
  3) Türkçe alan adlarını (ilac_adi_tahmini, skt, parti_no...) frontend'in
     beklediği alan adlarına (name, dosage, expiryDate, batchNo...) çevirir
  4) JSON olarak geri döner

Çalıştırma:
  cd backend
  pip install -r requirements.txt
  python app.py
  -> http://localhost:5000 adresinde ayağa kalkar
"""

import base64
import gc
import io
import re
import tempfile
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

# medloop_ocr_demo.py aynı klasörde olduğu için doğrudan import edilebilir.
from medloop_ocr_demo import run as run_ocr_pipeline

app = Flask(__name__)
# Geliştirme aşamasında Vite dev server'ının (genelde localhost:5173) bu API'ye
# istek atabilmesi için CORS'u tüm origin'lere açıyoruz. Prod'da bunu daraltın.
CORS(app)


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
        raw_result = run_ocr_pipeline(tmp_path)
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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
