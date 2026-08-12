"""
MedLoop Backend - Bildirim (notification) endpoint'leri
==========================================================
  GET   /notifications                 -> kullanıcının bildirimleri (en yeni önce)
  GET   /notifications/unread-count    -> okunmamış bildirim sayısı (badge için)
  PATCH /notifications/<id>/read       -> tek bildirimi okundu işaretle
  POST  /notifications/read-all        -> tüm bildirimleri okundu işaretle
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from auth.utils import get_current_user
from extensions import db
from models import Notification

notifications_bp = Blueprint("notifications", __name__, url_prefix="/notifications")


@notifications_bp.route("", methods=["GET"])
@jwt_required()
def list_notifications():
    user = get_current_user()
    query = Notification.query.filter_by(user_id=user.id)

    unread_only = request.args.get("unread") == "true"
    if unread_only:
        query = query.filter_by(is_read=False)

    limit = min(int(request.args.get("limit", 50)), 200)
    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
    return jsonify({"notifications": [n.to_dict() for n in notifications]})


@notifications_bp.route("/unread-count", methods=["GET"])
@jwt_required()
def unread_count():
    user = get_current_user()
    count = Notification.query.filter_by(user_id=user.id, is_read=False).count()
    return jsonify({"unreadCount": count})


@notifications_bp.route("/<int:notification_id>/read", methods=["PATCH"])
@jwt_required()
def mark_read(notification_id):
    user = get_current_user()
    notification = Notification.query.filter_by(id=notification_id, user_id=user.id).first()
    if not notification:
        return jsonify({"error": "Bildirim bulunamadı"}), 404
    notification.is_read = True
    db.session.add(notification)
    db.session.commit()
    return jsonify({"notification": notification.to_dict()})


@notifications_bp.route("/read-all", methods=["POST"])
@jwt_required()
def mark_all_read():
    user = get_current_user()
    Notification.query.filter_by(user_id=user.id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"ok": True})
