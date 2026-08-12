"""
MedLoop Backend - Veritabanı Modelleri
========================================
SQLAlchemy modelleri: User, Medication, Notification, DeviceToken.

Notification.type alanı şu değerlerden birini alır:
  - "medication_added"     : İlaç başarıyla eklendiğinde
  - "expiry_warning_week"  : Son kullanma tarihine 1 hafta kala
  - "expiry_warning_today" : Son kullanma tarihi bugün olduğunda
  - "delivered"             : İlaç eczaneye teslim edildiğinde (puan bilgisiyle)

Medication.status alanı:
  - "active"    : Kullanıcıda duruyor, henüz teslim edilmedi/süresi geçmedi
  - "expired"   : Son kullanma tarihi geçti (hâlâ teslim edilebilir)
  - "delivered" : Eczaneye teslim edildi (puan kazanıldı)
"""

from datetime import datetime, timezone

from extensions import db


def utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(120), nullable=True)
    points = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)

    medications = db.relationship(
        "Medication", backref="user", lazy=True, cascade="all, delete-orphan"
    )
    notifications = db.relationship(
        "Notification", backref="user", lazy=True, cascade="all, delete-orphan"
    )
    device_tokens = db.relationship(
        "DeviceToken", backref="user", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "points": self.points,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class Medication(db.Model):
    __tablename__ = "medications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    name = db.Column(db.String(255), nullable=False)
    dosage = db.Column(db.String(64), nullable=True)
    form = db.Column(db.String(64), nullable=True)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    batch_no = db.Column(db.String(64), nullable=True)
    gtin = db.Column(db.String(32), nullable=True)

    expiry_date = db.Column(db.Date, nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False, default="active", index=True)

    # SKT bildirimlerinin tekrar tekrar gönderilmesini engellemek için
    # (scheduler her gün çalışır, aynı ilaç için aynı uyarı bir kez gönderilmeli).
    notified_week_sent = db.Column(db.Boolean, nullable=False, default=False)
    notified_today_sent = db.Column(db.Boolean, nullable=False, default=False)

    added_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)
    delivered_at = db.Column(db.DateTime(timezone=True), nullable=True)

    notifications = db.relationship(
        "Notification", backref="medication", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "dosage": self.dosage,
            "form": self.form,
            "quantity": self.quantity,
            "batchNo": self.batch_no,
            "gtin": self.gtin,
            "expiryDate": self.expiry_date.isoformat() if self.expiry_date else None,
            "status": self.status,
            "addedAt": self.added_at.isoformat() if self.added_at else None,
            "deliveredAt": self.delivered_at.isoformat() if self.delivered_at else None,
        }


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    medication_id = db.Column(
        db.Integer, db.ForeignKey("medications.id"), nullable=True, index=True
    )

    type = db.Column(db.String(32), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    extra_data = db.Column(db.JSON, nullable=True)

    is_read = db.Column(db.Boolean, nullable=False, default=False, index=True)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "title": self.title,
            "message": self.message,
            "medicationId": self.medication_id,
            "extraData": self.extra_data,
            "isRead": self.is_read,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class DeviceToken(db.Model):
    """Push notification (FCM) göndermek için kullanıcının cihaz token'ları."""

    __tablename__ = "device_tokens"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    token = db.Column(db.String(512), unique=True, nullable=False)
    platform = db.Column(db.String(20), nullable=True)  # "android" | "ios" | "web"
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)


class MedicationCatalog(db.Model):
    """Türkiye'de onaylı ilaçların referans kataloğu (kullanıcı verisi DEĞİL).

    Kaynak: TABİP açık ilaç veri seti (CC0 lisans, T.C. Sağlık Bakanlığı ilaç
    kayıtları temel alınarak hazırlanmış) - bkz. data/ilac_katalog_LICENSE.txt
    ve scripts/seed_catalog.py.

    İki amaçla kullanılır:
      1) İlaç ekleme ekranında otomatik tamamlama (ürün adına göre arama)
      2) Taranan/girilen barkodun (GTIN) gerçek bir ilaçla doğrulanması
         (bkz. /scan endpoint'indeki katalog zenginleştirmesi)
    """

    __tablename__ = "medication_catalog"

    id = db.Column(db.Integer, primary_key=True)
    barcode = db.Column(db.String(32), nullable=False, index=True)
    atc_code = db.Column(db.String(16), nullable=True)
    active_ingredient = db.Column(db.String(255), nullable=True)
    product_name = db.Column(db.String(255), nullable=False, index=True)
    category_path = db.Column(db.String(512), nullable=True)
    description = db.Column(db.Text, nullable=True)

    def to_dict(self, include_description: bool = False):
        data = {
            "id": self.id,
            "barcode": self.barcode,
            "atcCode": self.atc_code,
            "activeIngredient": self.active_ingredient,
            "productName": self.product_name,
            "category": self.category_path,
        }
        if include_description:
            data["description"] = self.description
        return data
