"""
MedLoop Backend - Kullanıcı endpoint'leri
============================================
  GET    /users/me                  -> profil + puan bilgisi
  PATCH  /users/me                  -> profili günceller (şu an sadece { name })
  GET    /users/me/export           -> KVKK/GDPR tarzı "verilerimi dışa aktar":
                                        hesapla ilişkili tüm verilerin JSON kopyası
  DELETE /users/me                  -> hesabı ve ilişkili tüm verileri kalıcı siler
  POST   /users/me/device-tokens    -> push notification için FCM cihaz token'ı kaydet
                                        { token, platform? } (platform: "android"|"ios"|"web")
"""

from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from auth.utils import get_current_user
from extensions import db
from models import DeviceToken, Delivery, Medication, Notification

users_bp = Blueprint("users", __name__, url_prefix="/users")


@users_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = get_current_user()
    return jsonify({"user": user.to_dict()})


@users_bp.route("/me", methods=["PATCH"])
@jwt_required()
def update_me():
    """Profili günceller. Şu an sadece `name` alanı destekleniyor (Profil
    ekranındaki "İsmi düzenle"). Eczacı hesaplarında bu ad, eczane adı olarak
    da kullanılır (bkz. PharmacistHomeScreen)."""
    user = get_current_user()
    payload = request.get_json(silent=True) or {}

    if "name" in payload:
        name = (payload.get("name") or "").strip()
        if not name:
            return jsonify({"error": "İsim boş olamaz"}), 400
        if len(name) > 120:
            return jsonify({"error": "İsim en fazla 120 karakter olabilir"}), 400
        user.name = name

    db.session.add(user)
    db.session.commit()

    return jsonify({"user": user.to_dict()})


@users_bp.route("/me/export", methods=["GET"])
@jwt_required()
def export_my_data():
    """Kullanıcının backend'de kayıtlı tüm verilerinin bir JSON kopyasını
    döndürür (Gizlilik ekranındaki "Verilerimi dışa aktar"). Vatandaş için
    kendi teslimat taleplerini, eczacı için onayladığı teslimatları da içerir."""
    user = get_current_user()

    medications = (
        Medication.query.filter_by(user_id=user.id).order_by(Medication.added_at.asc()).all()
    )
    notifications = (
        Notification.query.filter_by(user_id=user.id).order_by(Notification.created_at.asc()).all()
    )
    deliveries_as_citizen = (
        Delivery.query.filter_by(citizen_id=user.id).order_by(Delivery.created_at.asc()).all()
    )
    deliveries_as_pharmacist = (
        Delivery.query.filter_by(pharmacist_id=user.id).order_by(Delivery.created_at.asc()).all()
        if user.role == "pharmacist"
        else []
    )

    return jsonify(
        {
            "exportedAt": datetime.now(timezone.utc).isoformat(),
            "profile": user.to_dict(),
            "medications": [m.to_dict() for m in medications],
            "notifications": [n.to_dict() for n in notifications],
            "deliveriesAsCitizen": [d.to_dict() for d in deliveries_as_citizen],
            "deliveriesAsPharmacist": [d.to_dict() for d in deliveries_as_pharmacist],
        }
    )


@users_bp.route("/me", methods=["DELETE"])
@jwt_required()
def delete_my_account():
    """Hesabı ve hesapla ilişkili tüm verileri kalıcı olarak siler (Gizlilik
    ekranındaki "Hesabımı sil"). Geri alınamaz.

    - Kullanıcının vatandaş olarak oluşturduğu teslimat talepleri silinir
      (ilaçları zaten cascade ile silineceği için tek başına anlamsız kalırlar).
    - Kullanıcının eczacı olarak onayladığı teslimatlar SİLİNMEZ (vatandaşın
      kendi geçmişinde görünmeye devam etmeli); sadece eczacı referansı
      temizlenir.
    - İlaçlar, bildirimler ve push cihaz token'ları User modelindeki cascade
      ile otomatik silinir (bkz. models.py).
    """
    user = get_current_user()

    Delivery.query.filter_by(citizen_id=user.id).delete(synchronize_session=False)
    Delivery.query.filter_by(pharmacist_id=user.id).update(
        {"pharmacist_id": None}, synchronize_session=False
    )

    db.session.delete(user)
    db.session.commit()

    return jsonify({"ok": True})


@users_bp.route("/me/device-tokens", methods=["POST"])
@jwt_required()
def register_device_token():
    user = get_current_user()
    payload = request.get_json(silent=True) or {}
    token = (payload.get("token") or "").strip()
    platform = (payload.get("platform") or "").strip() or None

    if not token:
        return jsonify({"error": "token zorunlu"}), 400

    existing = DeviceToken.query.filter_by(token=token).first()
    if existing:
        # Token zaten kayıtlı; sahibini güncelle (kullanıcı değişmiş olabilir - cihaz paylaşımı vb.)
        existing.user_id = user.id
        existing.platform = platform or existing.platform
        db.session.add(existing)
    else:
        db.session.add(DeviceToken(user_id=user.id, token=token, platform=platform))
    db.session.commit()

    return jsonify({"ok": True}), 201


@users_bp.route("/me/device-tokens", methods=["DELETE"])
@jwt_required()
def remove_device_token():
    """Logout sırasında ya da push notification'ları kapatırken çağrılabilir."""
    payload = request.get_json(silent=True) or {}
    token = (payload.get("token") or "").strip()
    if not token:
        return jsonify({"error": "token zorunlu"}), 400

    DeviceToken.query.filter_by(token=token).delete()
    db.session.commit()
    return jsonify({"ok": True})
