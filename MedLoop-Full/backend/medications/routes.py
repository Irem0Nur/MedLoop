"""
MedLoop Backend - İlaç (medication) endpoint'leri
====================================================
  POST   /medications             -> ilaç ekle (başarılı eklemede bildirim oluşur)
  GET    /medications              -> kullanıcının ilaçlarını listele (?status=active|expired|delivered)
  GET    /medications/<id>         -> tek ilaç detayı
  DELETE /medications/<id>         -> ilacı sil (yanlış eklenmişse)
  POST   /medications/<id>/deliver -> eczaneye teslim edildi olarak işaretle,
                                       puan ekle ve 'delivered' bildirimi oluştur

Hepsi JWT ile korunur (Authorization: Bearer <token>).
"""

from datetime import date, datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from auth.utils import get_current_user
from extensions import db
from models import Medication
from services.notify import create_notification
from services.points import award_points_for_delivery

medications_bp = Blueprint("medications", __name__, url_prefix="/medications")


def _parse_date(value) -> date | None:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


@medications_bp.route("", methods=["POST"])
@jwt_required()
def add_medication():
    user = get_current_user()
    payload = request.get_json(silent=True) or {}

    name = (payload.get("name") or "").strip()
    expiry_date = _parse_date(payload.get("expiryDate"))

    if not name:
        return jsonify({"error": "İlaç adı (name) zorunlu"}), 400
    if not expiry_date:
        return jsonify({"error": "expiryDate zorunlu ve 'YYYY-MM-DD' formatında olmalı"}), 400

    medication = Medication(
        user_id=user.id,
        name=name,
        dosage=(payload.get("dosage") or "").strip() or None,
        form=(payload.get("form") or "").strip() or None,
        quantity=int(payload.get("quantity") or 1),
        batch_no=(payload.get("batchNo") or "").strip() or None,
        gtin=(payload.get("gtin") or "").strip() or None,
        expiry_date=expiry_date,
        status="expired" if expiry_date < date.today() else "active",
    )
    db.session.add(medication)
    db.session.commit()

    # İlaç başarıyla eklendiğinde bildirim gönder.
    create_notification(
        user=user,
        type="medication_added",
        title="İlaç eklendi",
        message=f"{medication.name} envanterine eklendi. Son kullanma tarihi: {medication.expiry_date.strftime('%d.%m.%Y')}.",
        medication=medication,
    )

    return jsonify({"medication": medication.to_dict()}), 201


@medications_bp.route("", methods=["GET"])
@jwt_required()
def list_medications():
    user = get_current_user()
    query = Medication.query.filter_by(user_id=user.id)

    status = request.args.get("status")
    if status:
        query = query.filter_by(status=status)

    medications = query.order_by(Medication.expiry_date.asc()).all()
    return jsonify({"medications": [m.to_dict() for m in medications]})


@medications_bp.route("/<int:medication_id>", methods=["GET"])
@jwt_required()
def get_medication(medication_id):
    user = get_current_user()
    medication = Medication.query.filter_by(id=medication_id, user_id=user.id).first()
    if not medication:
        return jsonify({"error": "İlaç bulunamadı"}), 404
    return jsonify({"medication": medication.to_dict()})


@medications_bp.route("/<int:medication_id>", methods=["DELETE"])
@jwt_required()
def delete_medication(medication_id):
    user = get_current_user()
    medication = Medication.query.filter_by(id=medication_id, user_id=user.id).first()
    if not medication:
        return jsonify({"error": "İlaç bulunamadı"}), 404
    db.session.delete(medication)
    db.session.commit()
    return jsonify({"ok": True})


@medications_bp.route("/<int:medication_id>/deliver", methods=["POST"])
@jwt_required()
def deliver_medication(medication_id):
    user = get_current_user()
    medication = Medication.query.filter_by(id=medication_id, user_id=user.id).first()
    if not medication:
        return jsonify({"error": "İlaç bulunamadı"}), 404
    if medication.status == "delivered":
        return jsonify({"error": "Bu ilaç zaten teslim edildi olarak işaretlenmiş"}), 409

    medication.status = "delivered"
    medication.delivered_at = datetime.utcnow()
    db.session.add(medication)
    db.session.commit()

    earned_points = award_points_for_delivery(user)

    create_notification(
        user=user,
        type="delivered",
        title="Teslim edildi 🎉",
        message=f"{medication.name} eczaneye teslim edildi. +{earned_points} puan kazandın! Toplam puanın: {user.points}.",
        medication=medication,
        extra_data={"pointsEarned": earned_points, "totalPoints": user.points},
    )

    return jsonify(
        {
            "medication": medication.to_dict(),
            "pointsEarned": earned_points,
            "totalPoints": user.points,
        }
    )
