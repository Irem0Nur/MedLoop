# MedLoop — Frontend (Tarama & İlaç Ekleme)

Bu depo, MedLoop mobil tasarımının önceliklendirilen iki ekranını içerir:

- **İlaç Tara** (`src/screens/ScanScreen.jsx`) — gerçek kamera erişimi (`getUserMedia`), viewfinder animasyonu, fener ve galeriden fotoğraf seçme.
- **İlaç Ekle** (`src/screens/AddMedicineScreen.jsx`) — yalnızca tarama başarılı olduğunda açılan, taslak verilerle önceden doldurulmuş ve doğrulamalı form.

## Kurulum

```bash
npm install
npm run dev       # geliştirme sunucusu
npm run build     # üretim derlemesi (dist/)
```

Kamera erişimi tarayıcıların güvenlik kısıtlaması nedeniyle **HTTPS veya localhost** üzerinde çalışır.

## Backend entegrasyon noktası

Kamera tarafındaki OCR/barkod tanıma servisi ayrı bir repoda (git'e yüklendiği belirtilen backend). Bu frontend, o servis gelene kadar **`src/mock/scanService.js`** içinde sahte (mock) bir yanıt üretir.

Gerçek API'ye bağlamak için tek yapılması gereken `recognizeMedicine` fonksiyonunun içini backend endpoint'ine yönlendirmek — dosyanın başındaki yorum satırlarında örnek `fetch` çağrısı hazır durumda. Form, backend'in şu alanları döndürmesini bekler:

```json
{
  "name": "Amoksisilin",
  "dosage": "500 mg",
  "form": "Tablet",
  "quantity": 14,
  "batchNo": "AMX-2291",
  "expiryDate": "2027-03-18"
}
```

## Klasör yapısı

```
src/
  components/     ViewfinderCorners, BottomNav
  hooks/          useCamera (getUserMedia yaşam döngüsü)
  mock/           scanService (backend gelene kadar sahte yanıt)
  screens/        HomeScreen, ScanScreen, AddMedicineScreen
  index.css       tasarım token'ları (renkler, fontlar)
```

## Tasarım kaynağı

Renk paleti ve bileşen stilleri, paylaşılan mockup kaydından (nane yeşili / cam kart görünümü, koyu yeşil butonlar) örneklenmiştir. Ana sayfa burada yalnızca akışı gösterebilmek için minimal bir taslak olarak eklenmiştir — asıl ana sayfa tasarımı ayrı ele alınmalıdır.
