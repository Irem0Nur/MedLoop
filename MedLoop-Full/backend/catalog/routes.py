"""
MedLoop Backend - İlaç kataloğu (referans veri) endpoint'leri
=================================================================
Kaynak: TABİP açık ilaç veri seti (CC0, T.C. Sağlık Bakanlığı ilaç kayıtları
temel alınarak hazırlanmış). Kullanıcının kendi ilaçlarıyla (Medication)
KARIŞTIRILMAMALI — bu salt-okunur bir referans/katalog tablosudur.

  GET /catalog/search?q=...        -> ilaç ekleme ekranında otomatik tamamlama
                                       (ürün adı veya etken maddeye göre arama)
  GET /catalog/barcode/<barcode>   -> tek bir barkodu (GTIN) doğrula/ara
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import or_

from extensions import db
from models import MedicationCatalog

catalog_bp = Blueprint("catalog", __name__, url_prefix="/catalog")


@catalog_bp.route("/search", methods=["GET"])
@jwt_required()
def search_catalog():
    query = (request.args.get("q") or "").strip()
    if len(query) < 2:
        return jsonify({"error": "q en az 2 karakter olmalı"}), 400

    limit = min(int(request.args.get("limit", 15)), 50)
    like_pattern = f"%{query}%"

    results = (
        MedicationCatalog.query.filter(
            or_(
                MedicationCatalog.product_name.ilike(like_pattern),
                MedicationCatalog.active_ingredient.ilike(like_pattern),
            )
        )
        .order_by(MedicationCatalog.product_name.asc())
        .limit(limit)
        .all()
    )
    return jsonify({"results": [r.to_dict() for r in results]})


@catalog_bp.route("/barcode/<barcode>", methods=["GET"])
@jwt_required()
def lookup_barcode(barcode):
    barcode = barcode.strip().lstrip("0") or barcode.strip()
    # Bazı taramalarda başında fazladan "0" olabiliyor (GTIN-14 vs GTIN-13);
    # önce birebir dene, olmazsa baştaki sıfırları atarak tekrar dene.
    match = MedicationCatalog.query.filter_by(barcode=barcode.strip()).first()
    if not match:
        match = MedicationCatalog.query.filter(
            MedicationCatalog.barcode.endswith(barcode)
        ).first()
    if not match:
        return jsonify({"found": False}), 404

    return jsonify({"found": True, "medication": match.to_dict(include_description=True)})
