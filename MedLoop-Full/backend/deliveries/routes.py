"""
MedLoop Backend - Vatandaş -> Eczacı QR teslim akışı
=======================================================
  POST /deliveries/request       (vatandaş) -> seçilen ilaçlar için kısa
                                   ömürlü bir teslimat token'ı üretir. Bu
                                   token QR koduna gömülür (DeliveryQRScreen).
  GET  /deliveries/<token>       (vatandaş kendi teslimatı / herhangi bir
                                   eczacı) -> teslimat detayını görüntüle
                                   (DeliveryConfirmScreen, ya da vatandaş
                                   tarafında durum kontrolü için).
  POST /deliveries/<token>/confirm (eczacı) -> teslimatı onaylar: ilgili
                                   ilaçlar 'delivered' olur, vatandaşa puan
                                   eklenir ve bildirim gönderilir.
  GET  /deliveries               (eczacı) -> onayladığı teslimatların
                                   geçmişi (PharmacistHomeScreen/History).

Hepsi JWT ile korunur; rol bazlı erişim auth.utils.role_required ile.
"""

import secrets
from datetime import datetime, timedelta, timezone

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required

from auth.utils import get_current_user, role_required
from extensions import db
from models import Delivery, Medication, User
from services.notify import create_notification
from services.points import award_points_for_deliveries

deliveries_bp = Blueprint("deliveries", __name__, url_prefix="/deliveries")


def _utcnow():
    return datetime.now(timezone.utc)


@deliveries_bp.route("/request", methods=["POST"])
@role_required("citizen")
def request_delivery():
    user = get_current_user()
    payload = request.get_json(silent=True) or {}
    medication_ids = payload.get("medicationIds")

    if not isinstance(medication_ids, list) or not medication_ids:
        return jsonify({"error": "medicationIds (dolu bir liste) zorunlu"}), 400
    try:
        medication_ids = [int(mid) for mid in medication_ids]
    except (TypeError, ValueError):
        return jsonify({"error": "medicationIds sadece sayı içermeli"}), 400

    medications = (
        Medication.query.filter(
            Medication.id.in_(medication_ids),
            Medication.user_id == user.id,
            Medication.status != "delivered",
        )
        .all()
    )
    if len(medications) != len(set(medication_ids)):
        return (
            jsonify({"error": "Seçilen ilaçlardan bazıları bulunamadı ya da zaten teslim edilmiş"}),
            400,
        )

    items_snapshot = [
        {
            "id": m.id,
            "name": m.name,
            "dosage": m.dosage,
            "form": m.form,
            "quantity": m.quantity,
        }
        for m in medications
    ]

    minutes = current_app.config.get("DELIVERY_TOKEN_EXPIRES_MINUTES", 15)
    delivery = Delivery(
        token=secrets.token_urlsafe(24),
        citizen_id=user.id,
        medication_ids=[m.id for m in medications],
        items_snapshot=items_snapshot,
        status="pending",
        expires_at=_utcnow() + timedelta(minutes=minutes),
    )
    db.session.add(delivery)
    db.session.commit()

    return jsonify({"delivery": delivery.to_dict()}), 201


@deliveries_bp.route("/<token>", methods=["GET"])
@jwt_required()
def get_delivery(token):
    user = get_current_user()
    delivery = Delivery.query.filter_by(token=token).first()
    if not delivery:
        return jsonify({"error": "Teslimat bulunamadı"}), 404

    if delivery.status == "pending" and delivery.expires_at < _utcnow():
        delivery.status = "expired"
        db.session.add(delivery)
        db.session.commit()

    is_owner = delivery.citizen_id == user.id
    if not is_owner and user.role != "pharmacist":
        return jsonify({"error": "Bu işlem için yetkiniz yok"}), 403

    return jsonify({"delivery": delivery.to_dict()})


@deliveries_bp.route("/<token>/confirm", methods=["POST"])
@role_required("pharmacist")
def confirm_delivery(token):
    pharmacist = get_current_user()
    delivery = Delivery.query.filter_by(token=token).first()
    if not delivery:
        return jsonify({"error": "Teslimat bulunamadı"}), 404

    if delivery.status == "pending" and delivery.expires_at < _utcnow():
        delivery.status = "expired"
        db.session.add(delivery)
        db.session.commit()

    if delivery.status == "expired":
        return jsonify({"error": "Bu QR kodun süresi doldu, vatandaş yeniden oluşturmalı"}), 410
    if delivery.status != "pending":
        return jsonify({"error": "Bu teslimat zaten işlendi"}), 409

    citizen = User.query.get(delivery.citizen_id)
    if not citizen:
        return jsonify({"error": "Vatandaş hesabı bulunamadı"}), 404

    medications = Medication.query.filter(
        Medication.id.in_(delivery.medication_ids),
        Medication.user_id == citizen.id,
        Medication.status != "delivered",
    ).all()
    if len(medications) != len(delivery.medication_ids):
        return (
            jsonify({"error": "İlaçlardan bazıları artık mevcut değil ya da zaten teslim edilmiş"}),
            409,
        )

    now = _utcnow()
    for medication in medications:
        medication.status = "delivered"
        medication.delivered_at = now
        db.session.add(medication)

    delivery.status = "confirmed"
    delivery.pharmacist_id = pharmacist.id
    delivery.confirmed_at = now
    db.session.add(delivery)
    db.session.commit()

    earned_points = award_points_for_deliveries(citizen, len(medications))

    item_names = ", ".join(m.name for m in medications)
    create_notification(
        user=citizen,
        type="delivered",
        title="Teslim edildi 🎉",
        message=(
            f"{item_names} {pharmacist.name or 'bir eczane'} tarafından teslim alındı. "
            f"+{earned_points} puan kazandın! Toplam puanın: {citizen.points}."
        ),
        extra_data={
            "pointsEarned": earned_points,
            "totalPoints": citizen.points,
            "pharmacistName": pharmacist.name,
            "deliveryId": delivery.id,
        },
    )

    return jsonify(
        {
            "delivery": delivery.to_dict(),
            "pointsEarned": earned_points,
            "totalPoints": citizen.points,
        }
    )


@deliveries_bp.route("", methods=["GET"])
@role_required("pharmacist")
def list_deliveries():
    user = get_current_user()
    deliveries = (
        Delivery.query.filter_by(pharmacist_id=user.id, status="confirmed")
        .order_by(Delivery.confirmed_at.desc())
        .all()
    )
    return jsonify({"deliveries": [d.to_dict() for d in deliveries]})
