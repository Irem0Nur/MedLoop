"""
MedLoop Backend - Veritabanı Modelleri
========================================
SQLAlchemy modelleri: User, Medication, Notification, DeviceToken,
PasswordResetToken, UserLocation.

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
    # "citizen" (vatandaş) | "pharmacist" (eczacı). Eczacı hesaplarında `name`
    # eczane adı olarak kullanılır (PharmacistHomeScreen.pharmacyName vb.).
    role = db.Column(db.String(20), nullable=False, default="citizen", index=True)
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
    password_reset_tokens = db.relationship(
        "PasswordResetToken", backref="user", lazy=True, cascade="all, delete-orphan"
    )
    location = db.relationship(
        "UserLocation", backref="user", lazy=True, uselist=False, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "role": self.role,
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


class PasswordResetToken(db.Model):
    """"Şifremi unuttum" akışı için tek kullanımlık 6 haneli kod.

    Kod düz metin olarak SAKLANMAZ — password_hash gibi werkzeug ile
    hash'lenir (bkz. auth/routes.py). Bir kullanıcı için birden fazla
    kayıt olabilir (her istek yenisini üretir); yeni bir kod üretilirken
    o kullanıcının önceki kullanılmamış kodları silinir."""

    __tablename__ = "password_reset_tokens"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    code_hash = db.Column(db.String(255), nullable=False)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    used_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)


class UserLocation(db.Model):
    """Profil ekranındaki "Liderlik Tablosu" için kullanıcının son bilinen
    konumu. Kullanıcı Profil'den "Konumumu Güncelle" dediğinde cihaz
    GPS'inden alınan enlem/boylam buraya kaydedilir; il adı backend'de
    ters coğrafi kodlama (bkz. services/geocoding.py) ile bulunur.
    Ayrı bir tabloda tutulur (User'a doğrudan kolon eklemek yerine) —
    böylece mevcut `users` tablosuna dokunmadan, yeni tablo otomatik
    oluşur (bkz. app.py db.create_all())."""

    __tablename__ = "user_locations"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False, index=True)
    city = db.Column(db.String(100), nullable=True, index=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    updated_at = db.Column(db.DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class Delivery(db.Model):
    """Vatandaş -> eczacı QR teslim akışı.

    Vatandaş, teslim etmek istediği ilaçları seçip POST /deliveries/request
    çağırır; bu bir `token` üretir ve QR koduna gömülür (ilaç verisinin
    kendisi DEĞİL — sadece bu kısa token, böylece QR küçük kalır ve teslimat
    sunucu tarafında doğrulanabilir). Eczacı QR'ı okuyup token'ı
    GET /deliveries/<token> ile görüntüler, sonra POST
    /deliveries/<token>/confirm ile onaylar. Onayda: ilgili Medication
    kayıtları 'delivered' olur, vatandaşa puan eklenir ve bildirim gider.

    `items_snapshot`, teslimat talebi oluşturulduğu andaki ilaç bilgilerinin
    (isim/doz/form/adet) bir kopyasıdır — onay ekranında ve geçmişte
    Medication tablosuna tekrar join gerekmeden gösterilebilsin diye.
    """

    __tablename__ = "deliveries"

    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(64), unique=True, nullable=False, index=True)

    citizen_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    pharmacist_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)

    medication_ids = db.Column(db.JSON, nullable=False)
    items_snapshot = db.Column(db.JSON, nullable=False)

    # "pending" -> "confirmed" | "expired" | "cancelled"
    status = db.Column(db.String(20), nullable=False, default="pending", index=True)

    created_at = db.Column(db.DateTime(timezone=True), default=utcnow, nullable=False)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    confirmed_at = db.Column(db.DateTime(timezone=True), nullable=True)

    citizen = db.relationship("User", foreign_keys=[citizen_id])
    pharmacist = db.relationship("User", foreign_keys=[pharmacist_id])

    def to_dict(self):
        return {
            "id": self.id,
            "token": self.token,
            "citizenName": self.citizen.name if self.citizen else None,
            "pharmacistName": self.pharmacist.name if self.pharmacist else None,
            "items": self.items_snapshot,
            "status": self.status,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "expiresAt": self.expires_at.isoformat() if self.expires_at else None,
            "confirmedAt": self.confirmed_at.isoformat() if self.confirmed_at else None,
        }


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
    # Bazı kayıtlarda birden fazla etken madde virgülle/artı işaretiyle
    # birleştirilmiş şekilde geliyor ve 255 karakteri aşabiliyor (gerçek veri
    # setinde en uzunu 435 karakter) — Postgres String(255)'i SQLite'ın
    # aksine sıkı uyguladığı için burada Text kullanmak daha güvenli.
    active_ingredient = db.Column(db.Text, nullable=True)
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
