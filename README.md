# MedLoop — OCR + Barkod/Karekod Tanıma Prototipi

TEKNOFEST 2026 Sıfır Atık & Döngüsel Ekonomi başvurusu kapsamında, MedLoop'un
"Tara" adımının (ilaç kutusundan otomatik bilgi çıkarımı) teknik fizibilitesini
kanıtlamak için geliştirilen prototip.

## Nasıl çalışır?

Bir ilaç kutusu fotoğrafı verildiğinde, sistem sırasıyla dener:

1. **Karekod** (GS1 DataMatrix — Türkiye'de 2009'dan beri İlaç Takip Sistemi
   kapsamında zorunlu): bulunursa GTIN, Son Kullanma Tarihi, Parti No ve Seri
   No'yu **doğrudan ve garantili** biçimde verir; OCR/tahmine gerek kalmaz.
2. **EAN13 barkod** (karekod yoksa/okunamazsa): sadece GTIN verir.
3. **OCR** (Tesseract, tur+eng): ilaç adı/form gibi karekodda yer almayan
   alanlar için, ve karekod+barkod ikisi de başarısızsa SKT için yedek tahmin.

## Kurulum

```
pip install pytesseract pillow opencv-python-headless pyzbar pylibdmtx
```

Sistem bağımlılıkları:
```
Windows: Tesseract -> https://github.com/UB-Mannheim/tesseract/wiki
         (kurulumda "Turkish" dil paketi yoksa, tur.traineddata dosyasını
         https://github.com/tesseract-ocr/tessdata_fast adresinden indirip
         "...\Tesseract-OCR\tessdata\" klasörüne kopyalayın)
         zbar, libdmtx -> pip kurulumu genelde yeterli
macOS:   brew install tesseract tesseract-lang zbar libdmtx
Linux:   sudo apt install tesseract-ocr tesseract-ocr-tur libzbar0 libdmtx0t64
```

## Kullanım

```
python medloop_ocr_demo.py kutu1.jpg kutu2.jpg ...
```

Çıktıdaki `tanimlama_kaynagi` alanı (`karekod` / `barkod` / `ocr` /
`bulunamadi`) ve `skt_kaynagi` alanı (`karekod` / `ocr`), her sonucun hangi
yöntemden geldiğini gösterir.

## Test sonuçları (sonuclar.json)

4 gerçek ilaç kutusu fotoğrafı üzerinde test edilmiştir:

| Ürün | Kaynak | GTIN | SKT | İlaç adı | Form |
|---|---|---|---|---|---|
| Fito %5 Krem | barkod | ✅ | — | zayıf | ❌ |
| Raneks 20mg (barkod yüzeyi) | barkod | ✅ | — | ✅ RANEKS | ✅ Enterik Tablet |
| Ornisid Fort 500mg | barkod | ✅ | — | ❌ | ❌ |
| Raneks 20mg (karekod yüzeyi) | **karekod** | ✅ | **✅ 31.01.2027** | — | — |

**Sonuç:** Barkod okuma 4/4 (%100), karekod okuma 1/1 — bulanık çekilmiş bir
fotoğrafta bile SKT, parti no ve seri no doğrudan karekoddan okunmuştur.

## Geliştirme sürecinde bulunan ve düzeltilen bir hata

İlk denemede sistem, kutu üzerindeki "Ruhsat Numarası" tarihini SKT (son
kullanma tarihi) ile karıştırıyordu. Bağlam tabanlı bir filtre eklenerek
("Ruhsat" kelimesinin hemen ardından gelen tarihler elenir) düzeltilmiştir.

## Bilinen sınırlamalar

- İlaç adı/form çıkarımı (OCR) ışık ve çekim açısına duyarlıdır; bu yüzden
  mimaride ikincil/tamamlayıcı katman olarak konumlandırılmıştır.
- GTIN'i ilaç adı/etken madde bilgisine dönüştürmek için (herhangi bir ilaç
  için, sadece test edilenler için değil) TİTCK/SGK referanslı bir veri
  kaynağına entegrasyon gerekir — bu sonraki geliştirme fazının kapsamındadır.
