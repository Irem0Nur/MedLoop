# MedLoop — Komple Proje (Frontend + Backend Entegre)

Bu klasör, frontend (React/Vite) ile backend'i (Python OCR/barkod/karekod API'si)
birbirine bağlı halde içerir. Frontend, tarama sonucunu artık backend'den gerçek
olarak alıyor (mock veri değil).

## Klasör yapısı

```
MedLoop-Full/
├── backend/
│   ├── app.py                 <- Flask API (yeni)
│   ├── medloop_ocr_demo.py    <- OCR/barkod/karekod mantığı (senin orijinal dosyan)
│   └── requirements.txt       <- Python bağımlılıkları
└── frontend/
    ├── src/mock/scanService.js <- artık gerçek backend'e bağlanıyor
    ├── .env                    <- backend adresi burada tanımlı
    └── ... (geri kalan React/Vite projesi, değişmedi)
```

## Kurulum ve çalıştırma (ilk seferde)

### 1) Sistem bağımlılıkları (bir kere kurulur)
- **Tesseract OCR**: https://github.com/UB-Mannheim/tesseract/wiki (Windows) — kurulumda "Turkish" dilini işaretle
- **zbar** ve **libdmtx**: genelde aşağıdaki pip kurulumu DLL'lerini otomatik getirir; getirmezse `backend/medloop_ocr_demo.py` dosyasının en üstündeki yorumlarda alternatif linkler var.

### 2) Backend'i çalıştır
```
cd backend
python -m venv venv
venv\Scripts\activate          (Windows)   /   source venv/bin/activate   (Mac/Linux)
pip install -r requirements.txt
python app.py
```
`http://localhost:5000` adresinde ayakta kalmalı. Bu terminali açık bırak.

### 3) Frontend'i çalıştır (yeni bir terminalde)
```
cd frontend
npm install
npm run dev
```
Tarayıcıda açılan adrese git (genelde `http://localhost:5173`).

### 4) Test et
"Tara" ekranına gir, bir ilaç kutusu fotoğrafı çek ya da galeriden seç.
Artık sonuç gerçek OCR'dan geliyor (rastgele mock veri değil).

## Sorun giderme
- Backend'e istek atarken CORS hatası alırsan: `backend/app.py` içinde `CORS(app)` satırının olduğundan emin ol.
- "ModuleNotFoundError" alırsan: `pip install -r requirements.txt` komutunu backend klasöründe, sanal ortam aktifken çalıştırdığından emin ol.
- Tarama sonucu boş/hatalı geliyorsa: backend'in çalıştığı terminalde hata mesajı olup olmadığına bak — Flask hataları orada basılır.
