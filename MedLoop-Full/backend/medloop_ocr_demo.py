"""
MedLoop – İlaç Kutusu OCR + Barkod/Karekod Prototipi (TEKNOFEST 2026 Sıfır Atık & Döngüsel Ekonomi)
======================================================================================================

Amaç:
  Kullanıcının kamerayla taradığı bir ilaç kutusu fotoğrafından; ilaç adı, doz/miktar,
  farmasötik form, barkod (GTIN) ve mümkünse SKT/parti no bilgisini otomatik olarak
  çıkarmak. Bu, MedLoop'un "Tara" adımının (bkz. rapor Bölüm 3) teknik fizibilite kanıtıdır.

Yaklaşım (öncelik sırasına göre):
  1) KAREKOD (DataMatrix / GS1): Türkiye'de 2009'dan beri İlaç Takip Sistemi (İTS)
     kapsamında her ilaç kutusunda zorunlu. GTIN, Son Kullanma Tarihi (AI 17) ve
     Parti No'yu (AI 10) doğrudan, hiçbir OCR/tahmin gerekmeden içinde taşır.
     pylibdmtx (libdmtx) ile okunur ve GS1 element string'i ayrıştırılır.
  2) BARKOD (EAN13): Karekod okunamazsa/yoksa yedek olarak düz barkod pyzbar/zbar
     ile okunur — sadece GTIN verir, SKT/parti no vermez.
  3) OCR (Tesseract, tur+eng): Karekod+barkod hiçbiri okunamazsa veya ilaç adı/form
     gibi karekodda bulunmayan alanlar için yedek/tamamlayıcı katman.
     - Kutu fotoğrafları farklı açılarda çekilebildiği için 0/90/180/270 derece
       döndürülerek en yüksek güven skorunu veren yönelim otomatik seçilir.
     - Regex tabanlı alan ayrıştırma: ilaç adı, farmasötik form, SKT (bulunursa)

Not: pyzbar'ın kullandığı zbar kütüphanesi DataMatrix okumaz (sadece EAN/QK/Code128 vb.);
bu yüzden karekod için ayrı bir kütüphane (pylibdmtx/libdmtx) kullanılıyor.

Çalıştırma (VS Code / yerel ortam):
  pip install pytesseract pillow opencv-python-headless pyzbar pylibdmtx

  # Sistem bağımlılıkları (Tesseract + zbar + libdmtx):
  #   Windows: Tesseract  -> https://github.com/UB-Mannheim/tesseract/wiki ("Turkish" dilini seçin)
  #            zbar        -> pip install pyzbar sonrası DLL uyarısı verirse:
  #                           https://sourceforge.net/projects/zbar/ 'dan zbar kurun
  #            libdmtx     -> pip install pylibdmtx genelde DLL'i kendi indirir;
  #                           sorun olursa https://github.com/dmtx/dmtx-wrappers'a bakın
  #   macOS:   brew install tesseract tesseract-lang zbar libdmtx
  #   Linux:   sudo apt install tesseract-ocr tesseract-ocr-tur libzbar0 libdmtx0t64

  python medloop_ocr_demo.py path/to/kutu_fotografi.jpg [<fotograf2> ...]
"""

import sys
import re
import json
from datetime import date
from pathlib import Path

import cv2
import numpy as np
import pytesseract
from PIL import Image
from pyzbar.pyzbar import decode as zbar_decode
from pylibdmtx.pylibdmtx import decode as dmtx_decode

# Windows'ta Tesseract genelde PATH'e eklenmez; PATH'te bulunamazsa bilinen
# kurulum yollarını dener. Farklı bir yere kurduysanız bu listeye ekleyebilirsiniz.
if sys.platform.startswith("win"):
    import shutil
    if shutil.which("tesseract") is None:
        for candidate in (
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        ):
            if Path(candidate).exists():
                pytesseract.pytesseract.tesseract_cmd = candidate
                break

FORM_KEYWORDS = [
    "enterik tablet", "film kaplı tablet", "film tablet", "kapsül",
    "tablet", "şurup", "krem", "jel", "merhem", "ampul", "damla",
    "sprey", "flakon", "süspansiyon",
]

MONTHS_TR = "ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık"

SKT_PATTERNS = [
    re.compile(r"\b(\d{2})[./](\d{2})[./](\d{4})\b"),          # 05.2027 gibi kısa da yakalar
    re.compile(r"\b(\d{2})[./](\d{4})\b"),                      # 05/2027
    re.compile(rf"\b(\d{{1,2}})\s+({MONTHS_TR})\s+(\d{{4}})\b", re.IGNORECASE),
]

BARCODE_PATTERN = re.compile(r"\b\d{8,14}\b")


def detect_and_crop_box(bgr_img: np.ndarray, margin: int = 15) -> np.ndarray:
    """Fotoğraftaki koyu/mermer arka plandan parlak ilaç kutusunu ayırıp kırpar.
    Kutu bulunamazsa orijinal görüntüyü döndürür."""
    gray = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return bgr_img
    largest = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest)
    img_h, img_w = gray.shape
    # Kutu, görüntünün makul bir kısmını kaplamıyorsa (yanlış tespit), orijinali kullan
    if w * h < 0.05 * img_w * img_h:
        return bgr_img
    x0, y0 = max(0, x - margin), max(0, y - margin)
    x1, y1 = min(img_w, x + w + margin), min(img_h, y + h + margin)
    return bgr_img[y0:y1, x0:x1]


def load_and_preprocess(image_path: str) -> np.ndarray:
    img = cv2.imread(image_path)
    if img is None:
        # WEBP gibi formatlar için PIL fallback
        pil_img = Image.open(image_path).convert("RGB")
        img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    cropped = detect_and_crop_box(img)
    gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
    # Kontrastı artır (CLAHE) — kutu fotoğrafları genelde düşük ışıkta çekiliyor
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    # Büyütme genelde yardımcı olmuyor / gürültüyü artırıyor; kırpılmış görüntüde
    # kutu zaten yeterince büyük olduğundan ölçek 1.0 tutulur.
    scale = 1.0
    resized = cv2.resize(enhanced, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC) if scale != 1.0 else enhanced
    return resized


WORD_RE = re.compile(r"^[A-Za-zÇĞİıÖŞÜçğıöşü]{3,}$")


def best_orientation_ocr(gray_img: np.ndarray, lang: str = "tur+eng") -> tuple[str, int]:
    """0/90/180/270 derece dener. Skor = yüksek güvenli (>%40), alfabetik ve en az
    3 karakterli 'temiz' kelime sayısına dayalı güven toplamı. Ham güven toplamı yerine
    bunun kullanılması, barkod/gürültüden gelen yanlış-yüksek-güvenli sahte kelimelerin
    yanlış yönelimi kazandırmasını engeller."""
    best_text, best_score = "", -1
    for angle in (0, 90, 180, 270):
        if angle == 0:
            rotated = gray_img
        elif angle == 90:
            rotated = cv2.rotate(gray_img, cv2.ROTATE_90_CLOCKWISE)
        elif angle == 180:
            rotated = cv2.rotate(gray_img, cv2.ROTATE_180)
        else:
            rotated = cv2.rotate(gray_img, cv2.ROTATE_90_COUNTERCLOCKWISE)

        data = pytesseract.image_to_data(
            rotated, lang=lang, output_type=pytesseract.Output.DICT,
            config="--psm 6"
        )
        score = 0
        for w, c in zip(data["text"], data["conf"]):
            if c == "-1" or not w.strip():
                continue
            conf = int(c)
            if WORD_RE.match(w) and conf > 40:
                score += conf
        text = " ".join(w for w in data["text"] if w.strip())
        if score > best_score:
            best_text, best_score = text, score
    return best_text, best_score


def extract_fields(raw_text: str) -> dict:
    text_lower = raw_text.lower()

    # İlaç adı: genelde ardışık büyük harfli kelime(ler) + "mg" ifadesi
    name_match = re.search(r"\b([A-ZÇĞİÖŞÜ]{3,}(?:\s+[A-ZÇĞİÖŞÜ]{2,}){0,2})\s*[®]?\s*(\d{1,4}\s?mg)?", raw_text)
    ilac_adi = None
    if name_match:
        base = name_match.group(1).strip()
        doz = name_match.group(2)
        ilac_adi = f"{base} {doz}".strip() if doz else base

    form = next((f for f in FORM_KEYWORDS if f in text_lower), None)

    barcodes = BARCODE_PATTERN.findall(raw_text)
    barkod = max(barcodes, key=len) if barcodes else None

    skt = None
    exclude_context = re.compile(r"(ruhsat|no\s*[:.])", re.IGNORECASE)
    for pattern in SKT_PATTERNS:
        for m in pattern.finditer(raw_text):
            # Eşleşmenin hemen öncesindeki bağlamı kontrol et: "Ruhsat Numarası: 03.06.2009"
            # gibi ifadeler SKT değil, ruhsat tarihidir — bunları eleriz.
            context_before = raw_text[max(0, m.start() - 25):m.start()]
            if exclude_context.search(context_before):
                continue
            skt = m.group(0)
            break
        if skt:
            break

    return {
        "ilac_adi_tahmini": ilac_adi,
        "farmasotik_form": form,
        "barkod": barkod,
        "skt_bulundu_mu": skt is not None,
        "skt": skt,
    }


def detect_barcode(cropped_bgr: np.ndarray) -> str | None:
    """Barkod/GTIN okuması için OCR yerine özel bir barkod çözücü (pyzbar/zbar) kullanılır;
    gerçek MedLoop uygulamasında da tarama bu şekilde yapılacaktır — OCR ile basılı
    rakamları okumaya çalışmak barkodlar için güvenilir değildir."""
    gray = cv2.cvtColor(cropped_bgr, cv2.COLOR_BGR2GRAY)
    for angle in (0, 90, 180, 270):
        if angle == 0:
            rotated = gray
        elif angle == 90:
            rotated = cv2.rotate(gray, cv2.ROTATE_90_CLOCKWISE)
        elif angle == 180:
            rotated = cv2.rotate(gray, cv2.ROTATE_180)
        else:
            rotated = cv2.rotate(gray, cv2.ROTATE_90_COUNTERCLOCKWISE)
        results = zbar_decode(rotated)
        if results:
            return results[0].data.decode("utf-8")
    return None


# GS1 Application Identifier (AI) tablosu — İTS karekodunda kullanılan alanlar.
# (uzunluk, sabit_mi): sabit uzunluklu alanlarda ayraç aranmaz; değişken uzunluklu
# alanlarda (ör. Parti No) bir sonraki AI'a kadar veya GS (\x1d) ayracına kadar okunur.
GS1_AI_TABLE = {
    "01": (14, True),   # GTIN
    "17": (6, True),    # Son Kullanma Tarihi (YYMMDD)
    "10": (20, False),  # Parti/Lot Numarası (değişken, azami 20)
    "21": (20, False),  # Seri Numarası (değişken, azami 20)
}
GS_SEPARATOR = "\x1d"


def parse_gs1_element_string(raw: str) -> dict:
    """Karekoddan çözülen ham GS1 element string'ini Application Identifier'lara
    göre ayrıştırır. GS1 standardında değişken uzunluklu alanlar (10, 21) normalde
    bir GS (\\x1d) ayraç karakteriyle bitmelidir, ancak bazı üreticiler bu ayracı
    basmıyor/kaybediyor — bu durumda AI 17'nin (SKT, sabit 6 haneli ve geçerli bir
    ay içermesi gereken) konumu bir "çapa" olarak kullanılır: 21 alanı bu çapaya
    kadar, 10 alanı ise çapadan sonraki 10'dan itibaren string sonuna kadar okunur."""
    s = re.sub(r"^[^\d]+", "", raw)  # baştaki FNC1/']d2' gibi sembolleri temizle

    fields: dict[str, str] = {}

    # 1) GTIN her zaman baştadır ve sabit uzunlukludur.
    m01 = re.match(r"01(\d{14})", s)
    if not m01:
        return fields
    fields["01"] = m01.group(1)
    rest = s[m01.end():]

    # 2) SKT (17) alanını, ayraç olmasa bile geçerli bir tarih olacak şekilde ara.
    #    (17)(YY)(01-12)(01-31) — ay/gün aralığını doğrulayarak yanlış eşleşmeyi azaltır.
    m17 = re.search(r"17(\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])", rest)

    if rest.startswith("21") and m17:
        # 21 alanı, 17 çapasına kadar olan kısımdır (ayraç varsa zaten orada keser).
        seri_raw = rest[2:m17.start()]
        seri = seri_raw.split(GS_SEPARATOR)[0]
        fields["21"] = seri
        after_date = rest[m17.end():]
        fields["17"] = m17.group(1) + m17.group(2) + m17.group(3)
        # 3) 10 alanı, tarihten sonra gelir; ayraç varsa ona kadar, yoksa sona kadar.
        m10 = re.match(r"10(.+)$", after_date)
        if m10:
            fields["10"] = m10.group(1).split(GS_SEPARATOR)[0]
    else:
        # Ayraçlı/standart durum için genel amaçlı ayrıştırmaya düş.
        i = 0
        while i < len(rest):
            ai = rest[i:i + 2]
            if ai not in GS1_AI_TABLE:
                i += 1
                continue
            length, fixed = GS1_AI_TABLE[ai]
            i += 2
            if fixed:
                fields[ai] = rest[i:i + length]
                i += length
            else:
                end = rest.find(GS_SEPARATOR, i)
                if end == -1:
                    fields[ai] = rest[i:i + length]
                    i += len(fields[ai])
                else:
                    fields[ai] = rest[i:end]
                    i = end + 1
    return fields


def format_gs1_date(yymmdd: str) -> str | None:
    """GS1 'YYMMDD' formatını GG.AA.YYYY olarak okunur hale getirir."""
    if not yymmdd or len(yymmdd) != 6 or not yymmdd.isdigit():
        return None
    yy, mm, dd = yymmdd[0:2], yymmdd[2:4], yymmdd[4:6]
    year = 2000 + int(yy)  # İTS karekodları 2009 sonrası; 2000+ varsayımı güvenli
    try:
        # dd="00" bazı üreticilerde "ayın son günü" anlamına gelebilir; olduğu gibi göster
        return f"{dd}.{mm}.{year}"
    except ValueError:
        return None


def detect_karekod(bgr_img: np.ndarray) -> dict | None:
    """Karekodu (DataMatrix) pylibdmtx ile okuyup GS1 alanlarını ayrıştırır.
    Bulunursa: gtin, skt, parti_no, seri_no, ham alanlarını döndürür.
    Karekod genelde fotoğrafın küçük bir bölgesini kapladığından, tam görüntüye
    ek olarak kutuya kırpılmış + büyütülmüş versiyonlar da denenir — bu, uzaktan
    veya geniş kadrajla çekilmiş fotoğraflarda okuma başarısını artırır."""
    gray = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    cropped_bgr = detect_and_crop_box(bgr_img)
    cropped_gray = cv2.cvtColor(cropped_bgr, cv2.COLOR_BGR2GRAY)
    cropped_enh = clahe.apply(cropped_gray)

    candidates = []
    for scale in (3.0, 2.0):
        candidates.append(cv2.resize(cropped_gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC))
        candidates.append(cv2.resize(cropped_enh, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC))
    candidates.append(gray)
    candidates.append(enhanced)

    for candidate in candidates:
        for angle in (0, 90, 180, 270):
            if angle == 0:
                rotated = candidate
            elif angle == 90:
                rotated = cv2.rotate(candidate, cv2.ROTATE_90_CLOCKWISE)
            elif angle == 180:
                rotated = cv2.rotate(candidate, cv2.ROTATE_180)
            else:
                rotated = cv2.rotate(candidate, cv2.ROTATE_90_COUNTERCLOCKWISE)

            results = dmtx_decode(rotated, timeout=2000, max_count=1)
            if results:
                raw = results[0].data.decode("utf-8", errors="replace")
                fields = parse_gs1_element_string(raw)
                skt_raw = fields.get("17")
                return {
                    "ham_karekod": raw,
                    "gtin": fields.get("01"),
                    "skt": format_gs1_date(skt_raw) if skt_raw else None,
                    "parti_no": fields.get("10"),
                    "seri_no": fields.get("21"),
                }
    return None


def run(image_path: str) -> dict:
    bgr = cv2.imread(image_path)
    if bgr is None:
        bgr = cv2.cvtColor(np.array(Image.open(image_path).convert("RGB")), cv2.COLOR_RGB2BGR)

    # 1) Önce karekod (DataMatrix) denenir — bulunursa SKT ve parti no doğrudan,
    #    OCR/tahmin gerekmeden elde edilir.
    karekod = detect_karekod(bgr)

    # 2) Karekod yoksa/okunamazsa EAN13 barkod denenir (sadece GTIN verir).
    barkod = detect_barcode(bgr)

    # 3) OCR her durumda çalıştırılır — ilaç adı/form gibi karekodda olmayan
    #    alanlar ve karekod+barkod ikisi de okunamazsa yedek SKT tahmini için.
    cropped = detect_and_crop_box(bgr)
    gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    raw_text, confidence_sum = best_orientation_ocr(enhanced)
    fields = extract_fields(raw_text)

    if karekod:
        kaynak = "karekod"
        gtin = karekod["gtin"] or barkod or fields["barkod"]
        skt = karekod["skt"] or fields["skt"]
        skt_kaynak = "karekod" if karekod["skt"] else ("ocr" if fields["skt"] else None)
        parti_no = karekod["parti_no"]
        seri_no = karekod["seri_no"]
    else:
        kaynak = "barkod" if barkod else ("ocr" if fields["barkod"] else "bulunamadi")
        gtin = barkod or fields["barkod"]
        skt = fields["skt"]
        skt_kaynak = "ocr" if fields["skt"] else None
        parti_no = None
        seri_no = None

    return {
        "dosya": Path(image_path).name,
        "tanimlama_kaynagi": kaynak,  # karekod | barkod | ocr | bulunamadi
        "gtin": gtin,
        "parti_no": parti_no,
        "seri_no": seri_no,
        "skt": skt,
        "skt_kaynagi": skt_kaynak,  # karekod | ocr | None
        "ilac_adi_tahmini": fields["ilac_adi_tahmini"],
        "farmasotik_form": fields["farmasotik_form"],
        "guven_skoru_toplam": confidence_sum,
        "ham_metin_onizleme": raw_text[:300],
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Kullanım: python medloop_ocr_demo.py <görsel_yolu> [<görsel_yolu2> ...]")
        sys.exit(1)

    results = [run(p) for p in sys.argv[1:]]
    print(json.dumps(results, ensure_ascii=False, indent=2))