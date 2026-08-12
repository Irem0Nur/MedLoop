"""
MedLoop Backend - SKT (son kullanma tarihi) kontrol görevi
==============================================================
check_expiring_medications() günde bir kez (varsayılan 09:00) APScheduler
tarafından çalıştırılır ve şunları yapar:

  1) Son kullanma tarihine <= EXPIRY_WARNING_DAYS_BEFORE (varsayılan 7) gün
     kalan ve henüz "1 hafta kaldı" bildirimi gönderilmemiş ilaçlar için
     bildirim oluşturur.
  2) Son kullanma tarihi bugüne gelmiş/geçmiş ve henüz "süresi doldu"
     bildirimi gönderilmemiş ilaçlar için bildirim oluşturur.
  3) Süresi geçen "active" ilaçları "expired" durumuna çeker.

Not: Eşitlik (==) yerine <= kullanılması bilinçli bir tercih: sunucu bir
gün kapalı kalırsa ya da job gecikirse bile (örn. bugün+2 çalıştıysa)
kaçırılan bildirimler bir sonraki çalıştırmada hâlâ yakalanır — her ilaç
için notified_*_sent flag'i sayesinde aynı bildirim iki kez gönderilmez.
"""

import logging
import os
from datetime import date, timedelta

from extensions import db, scheduler
from models import Medication
from services.notify import create_notification

logger = logging.getLogger("medloop.scheduler")


def start_scheduler(app):
    """Uygulama başlarken bir kez çağrılır, günlük SKT kontrol job'ını kaydeder.

    İki güvenlik önlemi:
      - ENABLE_SCHEDULER=false ise (örn. testlerde) hiç başlatılmaz.
      - Flask debug modunda reloader süreci uygulamayı iki kez import eder;
        WERKZEUG_RUN_MAIN kontrolü job'ın iki kez kaydedilmesini engeller.
    """
    if not app.config.get("ENABLE_SCHEDULER", True):
        logger.info("ENABLE_SCHEDULER=false, zamanlanmış görev başlatılmadı.")
        return

    is_reloader_subprocess = os.environ.get("WERKZEUG_RUN_MAIN") == "true"
    if app.debug and not is_reloader_subprocess:
        # Reloader'ın ilk (izleyici) süreci; asıl iş bu süreçte değil,
        # WERKZEUG_RUN_MAIN=true olan çocuk süreçte çalışmalı.
        return

    if scheduler.running:
        return

    scheduler.add_job(
        func=lambda: check_expiring_medications(app),
        trigger="cron",
        hour=app.config.get("SCHEDULER_HOUR", 9),
        minute=app.config.get("SCHEDULER_MINUTE", 0),
        id="check_expiring_medications",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        "SKT kontrol görevi zamanlandı: her gün %02d:%02d.",
        app.config.get("SCHEDULER_HOUR", 9),
        app.config.get("SCHEDULER_MINUTE", 0),
    )


def check_expiring_medications(app):
    """app: Flask app instance. APScheduler ayrı bir thread'de çalıştığı için
    her seferinde kendi app context'ini açması gerekir."""
    with app.app_context():
        today = date.today()
        warning_days = app.config.get("EXPIRY_WARNING_DAYS_BEFORE", 7)
        week_threshold = today + timedelta(days=warning_days)

        _send_week_warnings(today, week_threshold)
        _send_today_warnings(today)
        _mark_expired(today)


def _send_week_warnings(today: date, week_threshold: date):
    candidates = Medication.query.filter(
        Medication.status == "active",
        Medication.notified_week_sent.is_(False),
        Medication.expiry_date > today,
        Medication.expiry_date <= week_threshold,
    ).all()

    for medication in candidates:
        days_left = (medication.expiry_date - today).days
        create_notification(
            user=medication.user,
            type="expiry_warning_week",
            title="Son kullanma tarihi yaklaşıyor",
            message=(
                f"{medication.name} ilacının son kullanma tarihine "
                f"{days_left} gün kaldı ({medication.expiry_date.strftime('%d.%m.%Y')}). "
                f"Kullanmayacaksan eczaneye teslim etmeyi unutma."
            ),
            medication=medication,
            extra_data={"daysLeft": days_left},
        )
        medication.notified_week_sent = True
        db.session.add(medication)

    if candidates:
        db.session.commit()
        logger.info("%d ilaç için 'son kullanma yaklaşıyor' bildirimi gönderildi.", len(candidates))


def _send_today_warnings(today: date):
    candidates = Medication.query.filter(
        Medication.status.in_(["active", "expired"]),
        Medication.notified_today_sent.is_(False),
        Medication.expiry_date <= today,
    ).all()

    for medication in candidates:
        create_notification(
            user=medication.user,
            type="expiry_warning_today",
            title="Son kullanma tarihi doldu",
            message=(
                f"{medication.name} ilacının son kullanma tarihi doldu "
                f"({medication.expiry_date.strftime('%d.%m.%Y')}). Lütfen kullanma, "
                f"en yakın eczaneye teslim ederek puan kazanabilirsin."
            ),
            medication=medication,
        )
        medication.notified_today_sent = True
        db.session.add(medication)

    if candidates:
        db.session.commit()
        logger.info("%d ilaç için 'son kullanma tarihi doldu' bildirimi gönderildi.", len(candidates))


def _mark_expired(today: date):
    expired = Medication.query.filter(
        Medication.status == "active",
        Medication.expiry_date < today,
    ).all()
    for medication in expired:
        medication.status = "expired"
        db.session.add(medication)
    if expired:
        db.session.commit()
        logger.info("%d ilaç 'expired' durumuna güncellendi.", len(expired))
