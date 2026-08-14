"""
MedLoop Backend - E-posta gönderim sarmalayıcısı
===================================================
SMTP_HOST/SMTP_USER/SMTP_PASSWORD ayarlanmazsa e-posta gönderimi sessizce
no-op olur: kod sadece loglanır, hata fırlatmaz (bkz. services/push.py'deki
aynı desen — kurulmamış bir dış servis, uygulamanın geri kalanını
kilitlememeli).

Kurulum (Gmail örneği):
  1) Google hesabında 2 adımlı doğrulamayı aç.
  2) https://myaccount.google.com/apppasswords adresinden bir "Uygulama
     Şifresi" oluştur (normal Gmail şifren DEĞİL, bu ayrı bir şifre).
  3) backend/.env dosyasına ekle:
       SMTP_HOST=smtp.gmail.com
       SMTP_PORT=587
       SMTP_USER=senin-adresin@gmail.com
       SMTP_PASSWORD=<uygulama şifresi>
       SMTP_FROM=senin-adresin@gmail.com
  4) Sunucuyu yeniden başlat.
"""

import logging
import smtplib
from email.mime.text import MIMEText

from flask import current_app

logger = logging.getLogger("medloop.email")


def send_password_reset_email(to_email: str, code: str) -> bool:
    """Şifre sıfırlama kodunu e-posta ile gönderir. SMTP ayarlanmamışsa
    (yerel geliştirmede olduğu gibi) kodu konsola loglar ve False döner —
    çağıran taraf (auth/routes.py) bu durumda da her zaman aynı genel
    başarı mesajını döndürmeli (hesap var/yok bilgisini sızdırmamak için)."""
    host = current_app.config.get("SMTP_HOST")
    smtp_user = current_app.config.get("SMTP_USER")
    smtp_password = current_app.config.get("SMTP_PASSWORD")
    from_addr = current_app.config.get("SMTP_FROM") or smtp_user

    if not host or not smtp_user or not smtp_password:
        logger.warning(
            "SMTP ayarlanmamış (.env'de SMTP_HOST/SMTP_USER/SMTP_PASSWORD eksik) — "
            "şifre sıfırlama kodu sadece loglanıyor. Alıcı: %s, Kod: %s",
            to_email,
            code,
        )
        return False

    expires_minutes = current_app.config.get("PASSWORD_RESET_CODE_EXPIRES_MINUTES", 15)
    body = (
        "Merhaba,\n\n"
        f"MedLoop hesabın için şifre sıfırlama kodun: {code}\n\n"
        f"Bu kod {expires_minutes} dakika içinde geçerliliğini yitirecek.\n"
        "Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin, hesabında "
        "herhangi bir değişiklik yapılmayacak.\n\n"
        "MedLoop"
    )
    msg = MIMEText(body, _charset="utf-8")
    msg["Subject"] = "MedLoop - Şifre Sıfırlama Kodu"
    msg["From"] = from_addr
    msg["To"] = to_email

    port = current_app.config.get("SMTP_PORT", 587)
    try:
        with smtplib.SMTP(host, port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(from_addr, [to_email], msg.as_string())
        return True
    except Exception:
        logger.exception("Şifre sıfırlama e-postası gönderilemedi: %s", to_email)
        return False
