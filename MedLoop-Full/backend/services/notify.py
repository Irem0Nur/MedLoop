"""
MedLoop Backend - Bildirim oluşturma servisi
==============================================
Sistemdeki her bildirim (ilaç eklendi, SKT uyarısı, teslim edildi) bu
fonksiyon üzerinden oluşturulmalı: hem DB'ye (uygulama içi bildirim listesi
için) yazar, hem de push notification tetikler. Böylece "bildirim
oluşturma" mantığı tek bir yerde toplanır.
"""

from extensions import db
from models import Notification
from services.push import send_push_to_user


def create_notification(
    user,
    type: str,
    title: str,
    message: str,
    medication=None,
    extra_data: dict | None = None,
    send_push: bool = True,
) -> Notification:
    notification = Notification(
        user_id=user.id,
        medication_id=medication.id if medication else None,
        type=type,
        title=title,
        message=message,
        extra_data=extra_data,
    )
    db.session.add(notification)
    db.session.commit()

    if send_push:
        send_push_to_user(user, title, body=message, data={"type": type, **(extra_data or {})})

    return notification
