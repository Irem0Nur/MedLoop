"""
MedLoop Backend - Auth (kayıt/giriş) endpoint'leri
=====================================================
  POST /auth/register         { email, password, name?, kvkkAccepted } -> { user, accessToken }
  POST /auth/login             { email, password }                      -> { user, accessToken }
  GET  /auth/me                (JWT gerekli)                              -> { user }
  POST /auth/forgot-password   { email }                     -> { ok }  (6 haneli kodu e-postayla gönderir)
  POST /auth/reset-password    { email, code, newPassword }  -> { ok }

Basit e-posta + şifre auth'u; şifreler werkzeug.security ile hash'lenir
(bcrypt tabanlı, ek bağımlılık gerekmez). JWT flask-jwt-extended ile üretilir.

KVKK: Kayıt sırasında `kvkkAccepted` alanı zorunludur — RegisterScreen'deki
onay kutucuğu işaretlenmeden istek gönderilmez, ama backend de aynı kuralı
tekrar doğrular (istemci tarafı doğrulamasına güvenilmez).

Şifremi unuttum: gerçek SMTP e-posta gönderimi kullanılır (bkz.
services/email.py). SMTP ayarlanmamışsa (yerel geliştirme) kod sadece
sunucu logunda görünür.
"""

import random
import re
import string
from datetime import datetime, timedelta, timezone

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db
from models import PasswordResetToken, User
from services.email import send_password_reset_email

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
VALID_ROLES = {"citizen", "pharmacist"}


def _generate_reset_code() -> str:
    return "".join(random.choices(string.digits, k=6))


@auth_bp.route("/register", methods=["POST"])
def register():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    name = (payload.get("name") or "").strip() or None
    # "citizen" (vatandaş) veya "pharmacist" (eczacı). Eczacı için `name`
    # eczane adı olarak kullanılır (RoleSelectionScreen'deki seçime göre
    # frontend gönderir).
    role = (payload.get("role") or "citizen").strip().lower()
    kvkk_accepted = bool(payload.get("kvkkAccepted"))

    if not email or not EMAIL_RE.match(email):
        return jsonify({"error": "Geçerli bir e-posta adresi gerekli"}), 400
    if len(password) < 6:
        return jsonify({"error": "Şifre en az 6 karakter olmalı"}), 400
    if role not in VALID_ROLES:
        return jsonify({"error": "Geçersiz rol"}), 400
    if not kvkk_accepted:
        return jsonify({"error": "KVKK Aydınlatma Metni'ni onaylaman gerekiyor"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Bu e-posta ile zaten bir hesap var"}), 409

    user = User(email=email, password_hash=generate_password_hash(password), name=name, role=role)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"user": user.to_dict(), "accessToken": token}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "E-posta veya şifre hatalı"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"user": user.to_dict(), "accessToken": token})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404
    return jsonify({"user": user.to_dict()})


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    """LoginScreen'deki "Şifremi unuttum" akışının 1. adımı: e-posta alır,
    hesap gerçekten varsa 6 haneli bir kod üretip e-postayla gönderir.

    Güvenlik: hesabın var olup olmadığını sızdırmamak için, e-posta ile
    eşleşen kullanıcı bulunamasa bile HER ZAMAN aynı genel başarı mesajını
    döndürürüz — sadece hesap gerçekten varsa arka planda kod üretilip
    e-posta gönderilir."""
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()

    if not email or not EMAIL_RE.match(email):
        return jsonify({"error": "Geçerli bir e-posta adresi gerekli"}), 400

    user = User.query.filter_by(email=email).first()
    if user:
        # Kullanılmamış eski kodları geçersiz kıl (bir kullanıcı için tek
        # geçerli kod kalsın).
        PasswordResetToken.query.filter_by(user_id=user.id, used_at=None).delete(
            synchronize_session=False
        )

        code = _generate_reset_code()
        expires_minutes = current_app.config.get("PASSWORD_RESET_CODE_EXPIRES_MINUTES", 15)
        reset_token = PasswordResetToken(
            user_id=user.id,
            code_hash=generate_password_hash(code),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=expires_minutes),
        )
        db.session.add(reset_token)
        db.session.commit()

        send_password_reset_email(user.email, code)

    return jsonify(
        {"ok": True, "message": "Bu e-posta ile bir hesap varsa, sıfırlama kodu gönderildi."}
    )


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    """"Şifremi unuttum" akışının 2. adımı: e-posta + kod + yeni şifre alır,
    kodu doğrular ve şifreyi günceller."""
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    code = (payload.get("code") or "").strip()
    new_password = payload.get("newPassword") or ""

    if not email or not code:
        return jsonify({"error": "E-posta ve kod gerekli"}), 400
    if len(new_password) < 6:
        return jsonify({"error": "Şifre en az 6 karakter olmalı"}), 400

    generic_error = ("Kod geçersiz veya süresi dolmuş", 400)

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": generic_error[0]}), generic_error[1]

    reset_token = (
        PasswordResetToken.query.filter_by(user_id=user.id, used_at=None)
        .order_by(PasswordResetToken.created_at.desc())
        .first()
    )
    if not reset_token or reset_token.expires_at < datetime.now(timezone.utc):
        return jsonify({"error": generic_error[0]}), generic_error[1]
    if not check_password_hash(reset_token.code_hash, code):
        return jsonify({"error": generic_error[0]}), generic_error[1]

    user.password_hash = generate_password_hash(new_password)
    reset_token.used_at = datetime.now(timezone.utc)
    db.session.add(user)
    db.session.add(reset_token)
    db.session.commit()

    return jsonify({"ok": True})
