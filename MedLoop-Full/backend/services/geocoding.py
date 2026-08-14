"""
MedLoop Backend - Ters coğrafi kodlama (reverse geocoding) servisi
=====================================================================
Profil ekranındaki "Liderlik Tablosu" için, kullanıcının cihaz GPS
konumundan (enlem/boylam) bulunduğu ili tespit eder. Ücretsiz ve API key
gerektirmeyen OpenStreetMap Nominatim servisi kullanılır.

Nominatim kullanım politikası gereği:
  - Anlamlı bir User-Agent header'ı zorunlu (yoksa istekler reddedilir).
  - Saniyede en fazla 1 istek gönderilmeli — bu uygulamada konum sadece
    kullanıcı elle "Konumumu Güncelle" dediğinde gönderildiği için bu
    sınıra doğal olarak uyulur.

Servis herhangi bir sebeple ulaşılamaz/hatalı olursa None döner; çağıran
taraf (users/routes.py) bu durumda kullanıcıya "konum tespit edilemedi"
mesajı gösterir, uygulamanın geri kalanını etkilemez.
"""

import logging

import requests

logger = logging.getLogger("medloop.geocoding")

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
USER_AGENT = "MedLoop-App/1.0 (ogrenci projesi; iletisim: medloop-destek@example.com)"


def reverse_geocode_city(latitude: float, longitude: float) -> str | None:
    """Enlem/boylamdan il adını döndürür (ör. "İzmir"). Bulunamazsa None."""
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={
                "format": "jsonv2",
                "lat": latitude,
                "lon": longitude,
                "accept-language": "tr",
                "zoom": 8,  # il seviyesi
            },
            headers={"User-Agent": USER_AGENT},
            timeout=8,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        logger.exception("Ters coğrafi kodlama başarısız (lat=%s, lon=%s)", latitude, longitude)
        return None

    address = data.get("address") or {}
    city = (
        address.get("province")
        or address.get("state")
        or address.get("city")
        or address.get("county")
    )
    return city.strip() if city else None
