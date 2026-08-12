"""Her adimin ayri ayri ne kadar surdugunu olcen gecici profil scripti.
Kullanim: python profile_scan.py <fotograf_yolu>
"""
import sys, time
import cv2
import numpy as np
from PIL import Image

from medloop_ocr_demo import (
    resize_to_max_dimension, detect_karekod, detect_barcode,
    detect_and_crop_box, best_orientation_ocr, extract_fields,
)

path = sys.argv[1]

t0 = time.time()
bgr = cv2.imread(path)
if bgr is None:
    bgr = cv2.cvtColor(np.array(Image.open(path).convert("RGB")), cv2.COLOR_RGB2BGR)
t1 = time.time()
print(f"1) Görsel yükleme: {t1-t0:.2f}s  (orijinal boyut: {bgr.shape[1]}x{bgr.shape[0]})")

bgr = resize_to_max_dimension(bgr)
t2 = time.time()
print(f"2) Küçültme: {t2-t1:.2f}s  (yeni boyut: {bgr.shape[1]}x{bgr.shape[0]})")

karekod = detect_karekod(bgr)
t3 = time.time()
print(f"3) Karekod arama: {t3-t2:.2f}s  (sonuc: {'bulundu' if karekod else 'bulunamadi'})")

barkod = detect_barcode(bgr)
t4 = time.time()
print(f"4) Barkod arama: {t4-t3:.2f}s  (sonuc: {barkod})")

cropped = detect_and_crop_box(bgr)
gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
enhanced = clahe.apply(gray)
t5 = time.time()
print(f"5) Kırpma+kontrast hazırlığı: {t5-t4:.2f}s")

raw_text, conf = best_orientation_ocr(enhanced)
t6 = time.time()
print(f"6) OCR (4 açı, Tesseract): {t6-t5:.2f}s")

print(f"\nTOPLAM: {t6-t0:.2f}s")
