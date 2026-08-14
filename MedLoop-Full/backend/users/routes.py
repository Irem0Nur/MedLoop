"""
MedLoop Backend - Kullanıcı endpoint'leri
============================================
  GET    /users/me                  -> profil + puan bilgisi
  PATCH  /users/me                  -> profili günceller (şu an sadece { name })
  GET    /users/me/export           -> KVKK/GDPR tarzı "verilerimi dışa aktar":
                                        hesapla ilişkili tüm verilerin JSON kopyası
  DELETE /users/me                  -> hesabı ve ilişkili tüm verileri kalıcı siler
  GET    /users/me/impact           -> vatandaşın teslim ettiği ilaçlardan
                                        tahmini CO2/su tasarrufu (bkz. aşağıdaki
                                        IMPACT_* sabitleri)
  PATCH  /users/me/location         -> cihaz GPS konumundan (lat/lon) ili tespit
                                        edip kaydeder { latitude, longitude }
  GET    /users/me/leaderboard      -> kullanıcının ilindeki puan liderlik tablosu
                                        (ilk 3 + kullanıcının kendi sırası)
  POST   /users/me/device-tokens    -> push notification için FCM cihaz token'ı kaydet
                                        { token, platform? } (platform: "android"|"ios"|"web")
"""

from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from auth.utils import get_current_user
from extensions import db
from models import DeviceToken, Delivery, Medication, Notification, User, UserLocation
from services.geocoding import reverse_geocode_city

users_bp = Blueprint("users", __name__, url_prefix="/users")

# "Etki Hesaplama" modülü için varsayılan katsayılar. Bunlar gerçek bilimsel
# ölçümler DEĞİL — güvenle teslim edilen (ve böylece evsel çöpe/lavaboya
# karışması önlenen) her bir teslimat için sabit, demo amaçlı bir tahmindir.
# Gerçek bir sistemde ilaç türü/miktarına göre değişen katsayılar kullanılır.
IMPACT_CO2_KG_PER_DELIVERY = 0.5
IMPACT_WATER_LITERS_PER_DELIVERY = 1000


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


@users_bp.route("/me/impact", methods=["GET"])
@jwt_required()
def my_impact():
    """Vatandaşın şimdiye kadar güvenle teslim ettiği (eczacı tarafından
    onaylanmış) ilaçlardan doğan tahmini çevresel etkiyi döndürür (Ana Sayfa
    / Profil'deki "Çevresel Etkin" kartı için). Sadece status="confirmed"
    teslimatlar sayılır — bekleyen/iptal/süresi geçmiş talepler etkiye
    dahil edilmez. Rakamlar bilimsel bir ölçüm değil, dosya başındaki
    IMPACT_* sabitleriyle hesaplanan DEMO amaçlı bir tahmindir."""
    user = get_current_user()

    total_deliveries = Delivery.query.filter_by(citizen_id=user.id, status="confirmed").count()

    return jsonify(
        {
            "totalDeliveries": total_deliveries,
            "co2SavedKg": round(total_deliveries * IMPACT_CO2_KG_PER_DELIVERY, 2),
            "waterSavedLiters": round(total_deliveries * IMPACT_WATER_LITERS_PER_DELIVERY, 2),
            "co2PerDeliveryKg": IMPACT_CO2_KG_PER_DELIVERY,
            "waterPerDeliveryLiters": IMPACT_WATER_LITERS_PER_DELIVERY,
        }
    )


@users_bp.route("/me/location", methods=["PATCH"])
@jwt_required()
def update_my_location():
    """Profil ekranındaki "Konumumu Güncelle" — cihaz GPS'inden alınan
    enlem/boylamı ters coğrafi kodlamayla ile çevirip kaydeder (bkz.
    services/geocoding.py, OpenStreetMap Nominatim kullanır, API key
    gerektirmez)."""
    user = get_current_user()
    payload = request.get_json(silent=True) or {}

    try:
        latitude = float(payload.get("latitude"))
        longitude = float(payload.get("longitude"))
    except (TypeError, ValueError):
        return jsonify({"error": "Geçerli bir enlem/boylam gerekli"}), 400

    city = reverse_geocode_city(latitude, longitude)
    if not city:
        return jsonify({"error": "Konumundan il tespit edilemedi, tekrar dene"}), 502

    location = UserLocation.query.filter_by(user_id=user.id).first()
    if not location:
        location = UserLocation(user_id=user.id)
    location.city = city
    location.latitude = latitude
    location.longitude = longitude
    db.session.add(location)
    db.session.commit()

    return jsonify({"city": city})


@users_bp.route("/me/leaderboard", methods=["GET"])
@jwt_required()
def my_leaderboard():
    """Profil ekranındaki "Liderlik Tablosu" — kullanıcının ilindeki
    vatandaşları MedLoop puanına göre sıralar (ilk 3 + kullanıcının kendi
    sırası, ilk 3'te değilse de). Sadece "citizen" rolündeki kullanıcılar
    sayılır (puan sadece teslimat yapan vatandaşlarda birikir — bkz.
    services/points.py). Kullanıcı henüz konumunu paylaşmadıysa
    city=None döner; frontend bu durumda "konumunu paylaş" istemi gösterir."""
    user = get_current_user()

    location = UserLocation.query.filter_by(user_id=user.id).first()
    if not location or not location.city:
        return jsonify({"city": None, "topThree": [], "me": None})

    city_users = (
        User.query.join(UserLocation, UserLocation.user_id == User.id)
        .filter(User.role == "citizen", UserLocation.city == location.city)
        .order_by(User.points.desc(), User.id.asc())
        .all()
    )

    top_three = [{"id": u.id, "name": u.name, "points": u.points} for u in city_users[:3]]

    me_rank = next((i + 1 for i, u in enumerate(city_users) if u.id == user.id), None)
    me = (
        {"id": user.id, "name": user.name, "points": user.points, "rank": me_rank}
        if me_rank is not None
        else None
    )

    return jsonify({"city": location.city, "topThree": top_three, "me": me})


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
