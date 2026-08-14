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
        return jsonify({"error": "q en az 2 karakter olmal?"}), 400

    try:
        limit = min(max(int(request.args.get("limit", 15)), 1), 50)
    except ValueError:
        limit = 15

    prefix_pattern = f"{query}%"
    contains_pattern = f"%{query}%"

    results = []
    existing_ids = []

    # 1. En y?ksek ?ncelik: ?r?n ad? sorguyla ba?layan ila?lar
    product_prefix = (
        MedicationCatalog.query.filter(
            MedicationCatalog.product_name.ilike(prefix_pattern)
        )
        .order_by(MedicationCatalog.product_name.asc())
        .limit(limit)
        .all()
    )

    results.extend(product_prefix)
    existing_ids.extend(item.id for item in product_prefix)

    # 2. Sonra etken maddesi sorguyla ba?layan ila?lar
    if len(results) < limit:
        remaining = limit - len(results)

        active_query = MedicationCatalog.query.filter(
            MedicationCatalog.active_ingredient.ilike(prefix_pattern)
        )

        if existing_ids:
            active_query = active_query.filter(
                ~MedicationCatalog.id.in_(existing_ids)
            )

        active_results = (
            active_query
            .order_by(MedicationCatalog.product_name.asc())
            .limit(remaining)
            .all()
        )

        results.extend(active_results)
        existing_ids.extend(item.id for item in active_results)

    # 3. H?l? yer varsa i?erik e?le?melerini getir
    if len(results) < limit:
        remaining = limit - len(results)

        fallback_query = MedicationCatalog.query.filter(
            or_(
                MedicationCatalog.product_name.ilike(contains_pattern),
                MedicationCatalog.active_ingredient.ilike(contains_pattern),
            )
        )

        if existing_ids:
            fallback_query = fallback_query.filter(
                ~MedicationCatalog.id.in_(existing_ids)
            )

        fallback_results = (
            fallback_query
            .order_by(MedicationCatalog.product_name.asc())
            .limit(remaining)
            .all()
        )

        results.extend(fallback_results)

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
