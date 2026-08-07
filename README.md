# MedLoop — OCR + Barkod/Karekod Tanıma Prototipi

TEKNOFEST 2026 Sıfır Atık & Döngüsel Ekonomi başvurusu kapsamında, MedLoop'un
"Tara" adımının (ilaç kutusundan otomatik bilgi çıkarımı) teknik fizibilitesini
kanıtlamak için geliştirilen prototip.

## Nasıl çalışır?

Bir ilaç kutusu fotoğrafı verildiğinde, sistem sırasıyla dener:

1. **Karekod** (GS1 DataMatrix — Türkiye'de 2009'dan beri İlaç Takip Sistemi
   kapsamında zorunlu): bulunursa GTIN, Son Kullanma Tarihi, Parti No ve Seri
   No'yu **doğrudan ve garantili** biçimde verir; OCR/tahmine gerek kalmaz.
<<<<<<< HEAD
=======
   GS1 element string'i, bazı üreticilerin basmadığı ayraç (GS) karakteri
   olmasa bile SKT alanını (17 + geçerli ay/gün) bir "çapa" olarak kullanarak
   doğru ayrıştırılır.
>>>>>>> 2a52f6296e95fce945993a235ed02c3a61117b6b
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

<<<<<<< HEAD
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
=======
Not: Karekod tespiti, fotoğrafta karekod yoksa görüntüyü birden çok ölçek/açıda
denediği için ürün başına ~20-55 saniye sürebilir. Bu bir demo/prototip
davranışıdır; gerçek mobil uygulamada kamera canlı akışı ve donanım hızlandırma
ile bu süre saniyenin çok altına iner.

## Test sonuçları (sonuclar.json)

3 farklı ürünün hem barkod hem karekod yüzeyi olmak üzere toplam 6 fotoğraf
test edilmiştir:

| Ürün | Kaynak | GTIN | SKT |
|---|---|---|---|
| Fito %5 Krem (barkod yüzeyi) | barkod | ✅ 8699772350493 | — |
| Raneks 20mg (barkod yüzeyi) | barkod | ✅ 8699569040071 | — |
| Ornisid Fort 500mg (barkod yüzeyi) | barkod | ✅ 8699514092377 | — |
| Raneks 20mg (karekod yüzeyi) | **karekod** | ✅ 08699569040071 | **31.01.2027** |
| Fito %5 Krem (karekod yüzeyi) | **karekod** | ✅ 08699772350493 | **31.07.2028** |
| Ornisid Fort 500mg (karekod yüzeyi) | **karekod** | ✅ 08699514092377 | **31.12.2028** |

**Sonuç:** Barkod okuma 3/3, karekod okuma 3/3 (%100) — 3 farklı üründe de
GTIN, SKT, parti no ve seri no doğrudan karekoddan, hiç OCR'a başvurmadan
doğru biçimde okunmuştur. Bazı fotoğraflar bulanık çekilmiş olmasına rağmen
başarı oranı değişmemiştir.

## Geliştirme sürecinde bulunan ve düzeltilen iki hata

1. Sistem ilk denemede kutu üzerindeki "Ruhsat Numarası" tarihini SKT ile
   karıştırıyordu. Bağlam tabanlı bir filtre eklenerek düzeltildi.
2. Bazı üreticiler GS1 karekodunda alanlar arası ayraç (GS, `\x1d`) karakterini
   basmıyor. İlk sürüm bu durumda Seri No alanının SKT ve Parti No'yu da
   içine alıp bozmasına neden oluyordu. Ayrıştırıcı, SKT alanını (geçerli
   ay/gün içeren 6 haneli tarih) bir "çapa" noktası olarak kullanacak şekilde
   güçlendirilerek düzeltildi.
>>>>>>> 2a52f6296e95fce945993a235ed02c3a61117b6b

## Bilinen sınırlamalar

- İlaç adı/form çıkarımı (OCR) ışık ve çekim açısına duyarlıdır; bu yüzden
  mimaride ikincil/tamamlayıcı katman olarak konumlandırılmıştır.
- GTIN'i ilaç adı/etken madde bilgisine dönüştürmek için (herhangi bir ilaç
  için, sadece test edilenler için değil) TİTCK/SGK referanslı bir veri
  kaynağına entegrasyon gerekir — bu sonraki geliştirme fazının kapsamındadır.
