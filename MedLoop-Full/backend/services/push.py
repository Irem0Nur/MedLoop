"""
MedLoop Backend - Push Notification (Firebase Cloud Messaging) servisi
========================================================================
Firebase service account key'i tanımlı DEĞİLSE (yani henüz bir Firebase
projesi bağlanmadıysa) bu modül sessizce no-op çalışır: sadece log basar,
hata fırlatmaz. Böylece uygulama içi bildirim sistemi (DB'ye yazma) push
kurulu olmadan da tam çalışır durumda kalır.

Firebase projesi hazır olduğunda:
  1) Firebase Console > Project Settings > Service Accounts'tan bir
     service account JSON dosyası indir.
  2) Bu dosyayı sunucuya koy (örn. secrets/firebase-service-account.json)
     ve FIREBASE_CREDENTIALS_PATH env değişkenini o yola ayarla.
  3) Mobil uygulama (Capacitor Push Notifications plugin) her cihaz için
     bir FCM token üretir; bu token'ı POST /users/me/device-tokens ile
     backend'e kaydet.
  4) Bu modül otomatik olarak gerçek push göndermeye başlar.
"""

import logging

from flask import current_app

logger = logging.getLogger("medloop.push")

_firebase_app = None
_init_attempted = False


def _get_firebase_app():
    """Firebase Admin SDK'yı tembel (lazy) şekilde başlatır. Credential
    dosyası yoksa/okunamıyorsa None döner ve bir daha denemez (tekrar tekrar
    aynı hatayı loglamamak için)."""
    global _firebase_app, _init_attempted
    if _firebase_app is not None or _init_attempted:
        return _firebase_app

    _init_attempted = True
    cred_path = current_app.config.get("FIREBASE_CREDENTIALS_PATH")
    if not cred_path:
        logger.warning(
            "FIREBASE_CREDENTIALS_PATH ayarlanmamış; push notification "
            "gönderilmeyecek (sadece uygulama içi bildirimler çalışacak)."
        )
        return None

    try:
        import firebase_admin
        from firebase_admin import credentials

        cred = credentials.Certificate(cred_path)
        _firebase_app = firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK başlatıldı, push notification aktif.")
    except Exception as exc:  # noqa: BLE001 - push opsiyonel bir özellik, uygulamayı düşürmemeli
        logger.error("Firebase Admin SDK başlatılamadı: %s", exc)
        _firebase_app = None

    return _firebase_app


def send_push_to_tokens(tokens: list[str], title: str, body: str, data: dict | None = None) -> None:
    """Verilen FCM token listesine push notification gönderir.
    Firebase kurulu değilse veya token listesi boşsa hiçbir şey yapmaz."""
    if not tokens:
        return

    app = _get_firebase_app()
    if app is None:
        logger.info("[push devre dışı] '%s' başlıklı bildirim %d cihaza gönderilecekti.", title, len(tokens))
        return

    try:
        from firebase_admin import messaging

        message = messaging.MulticastMessage(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            tokens=tokens,
        )
        response = messaging.send_each_for_multicast(message, app=app)
        logger.info(
            "Push gönderildi: %d başarılı, %d başarısız.",
            response.success_count,
            response.failure_count,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Push notification gönderilemedi: %s", exc)


def send_push_to_user(user, title: str, body: str, data: dict | None = None) -> None:
    """Kullanıcının kayıtlı tüm cihaz token'larına push gönderir."""
    tokens = [dt.token for dt in user.device_tokens]
    send_push_to_tokens(tokens, title, body, data)
