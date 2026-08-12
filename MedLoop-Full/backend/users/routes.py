"""
MedLoop Backend - Kullanıcı endpoint'leri
============================================
  GET  /users/me                  -> profil + puan bilgisi
  POST /users/me/device-tokens    -> push notification için FCM cihaz token'ı kaydet
                                      { token, platform? } (platform: "android"|"ios"|"web")
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from auth.utils import get_current_user
from extensions import db
from models import DeviceToken

users_bp = Blueprint("users", __name__, url_prefix="/users")


@users_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = get_current_user()
    return jsonify({"user": user.to_dict()})


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
