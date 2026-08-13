"""
MedLoop Backend - Auth (kayıt/giriş) endpoint'leri
=====================================================
  POST /auth/register  { email, password, name? }  -> { user, accessToken }
  POST /auth/login      { email, password }          -> { user, accessToken }
  GET  /auth/me         (JWT gerekli)                  -> { user }

Basit e-posta + şifre auth'u; şifreler werkzeug.security ile hash'lenir
(bcrypt tabanlı, ek bağımlılık gerekmez). JWT flask-jwt-extended ile üretilir.
"""

import re

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db
from models import User

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
VALID_ROLES = {"citizen", "pharmacist"}


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

    if not email or not EMAIL_RE.match(email):
        return jsonify({"error": "Geçerli bir e-posta adresi gerekli"}), 400
    if len(password) < 6:
        return jsonify({"error": "Şifre en az 6 karakter olmalı"}), 400
    if role not in VALID_ROLES:
        return jsonify({"error": "Geçersiz rol"}), 400

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
