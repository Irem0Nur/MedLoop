"""
MedLoop Backend - İlaç kataloğu içe aktarma
==============================================
data/ilac_katalog.csv.zip içindeki TABİP açık ilaç veri setini (CC0 lisans,
bkz. data/ilac_katalog_LICENSE.txt) MedicationCatalog tablosuna aktarır.

Kaynak veri seti: https://github.com/Tip-Atlasi-Projesi/ilaclardb
İçerik: T.C. Sağlık Bakanlığı ilaç kayıtları temel alınarak hazırlanmış
barkod, ATC kodu, etken madde, ürün adı ve kategori bilgileri (~22.000 kayıt).

Kullanım:
  flask --app app.py seed-catalog          # tablo boşsa aktarır
  flask --app app.py seed-catalog --force  # tablo doluysa bile sıfırlayıp yeniden aktarır
"""

import csv
import io
import zipfile
from pathlib import Path

from extensions import db
from models import MedicationCatalog

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CSV_ZIP_PATH = DATA_DIR / "ilac_katalog.csv.zip"

# CSV'de sütun sırası (başlık satırı yok): id, barkod, ATC kodu, etken madde,
# ürün adı, kategori 1-5, açıklama. Kaynak: ilaclardb reposunun README'si.
COLUMN_COUNT = 11
BATCH_SIZE = 2000


def _read_rows():
    """Zip içindeki CSV'yi diske açmadan (bellekte) okur, satır satır üretir."""
    with zipfile.ZipFile(CSV_ZIP_PATH) as zf:
        # Zip içindeki asıl CSV dosyasını bul (macOS'un eklediği __MACOSX/
        # gölge dosyalarını atla).
        csv_names = [n for n in zf.namelist() if n.endswith(".csv") and "__MACOSX" not in n]
        if not csv_names:
            raise FileNotFoundError("Zip içinde .csv dosyası bulunamadı")
        with zf.open(csv_names[0]) as raw:
            text_stream = io.TextIOWrapper(raw, encoding="utf-8")
            reader = csv.reader(text_stream)
            for row in reader:
                if len(row) != COLUMN_COUNT:
                    continue  # bozuk/eksik satırları sessizce atla
                yield row


def _row_to_mapping(row):
    _id, barcode, atc_code, active_ingredient, product_name, c1, c2, c3, c4, c5, description = row

    categories = [c.strip() for c in (c1, c2, c3, c4, c5) if c and c.strip()]
    # Aynı kategori art arda tekrar edebiliyor (ör. son iki seviye aynı olabiliyor);
    # ardışık tekrarları temizleyerek daha okunabilir bir "yol" oluşturuyoruz.
    deduped = []
    for c in categories:
        if not deduped or deduped[-1] != c:
            deduped.append(c)

    return {
        "barcode": barcode.strip(),
        "atc_code": (atc_code or "").strip() or None,
        "active_ingredient": (active_ingredient or "").strip() or None,
        "product_name": (product_name or "").strip(),
        "category_path": " > ".join(deduped) or None,
        "description": (description or "").strip() or None,
    }


def import_catalog(app, force: bool = False) -> int:
    """Kataloğu DB'ye aktarır. Zaten kayıt varsa ve force=False ise atlar.
    Döndürülen değer: eklenen kayıt sayısı."""
    with app.app_context():
        existing = MedicationCatalog.query.count()
        if existing and not force:
            print(f"Katalogda zaten {existing} kayıt var, atlanıyor (force=True ile zorlayabilirsin).")
            return 0

        if existing and force:
            print(f"force=True: mevcut {existing} kayıt siliniyor...")
            MedicationCatalog.query.delete()
            db.session.commit()

        if not CSV_ZIP_PATH.exists():
            raise FileNotFoundError(
                f"Veri seti bulunamadı: {CSV_ZIP_PATH}. "
                "data/ilac_katalog.csv.zip dosyasının repo'da olduğundan emin ol."
            )

        batch = []
        total = 0
        for row in _read_rows():
            batch.append(_row_to_mapping(row))
            if len(batch) >= BATCH_SIZE:
                db.session.bulk_insert_mappings(MedicationCatalog, batch)
                db.session.commit()
                total += len(batch)
                print(f"  ... {total} kayıt aktarıldı")
                batch = []

        if batch:
            db.session.bulk_insert_mappings(MedicationCatalog, batch)
            db.session.commit()
            total += len(batch)

        print(f"Toplam {total} ilaç kataloğa aktarıldı.")
        return total
