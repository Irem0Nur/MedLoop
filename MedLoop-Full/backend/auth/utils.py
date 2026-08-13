"""Diğer blueprint'lerin JWT'den mevcut kullanıcıyı çekmesi için ortak yardımcı."""

from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from extensions import jwt
from models import User


def get_current_user() -> User | None:
    user_id = get_jwt_identity()
    if user_id is None:
        return None
    return User.query.get(int(user_id))


# Hesabını sildiren bir kullanıcının eski (hâlâ süresi dolmamış) JWT'siyle
# istek atmaya devam etmesini engeller: token imza/süre olarak geçerli olsa
# bile, arkasındaki kullanıcı artık DB'de yoksa @jwt_required() korumalı HER
# endpoint otomatik olarak 401 döner (tek tek route'larda get_current_user()
# None kontrolü yapmaya gerek kalmadan).
@jwt.user_lookup_loader
def _user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data.get("sub")
    if identity is None:
        return None
    return User.query.get(int(identity))


@jwt.user_lookup_error_loader
def _user_lookup_error_callback(_jwt_header, _jwt_data):
    return jsonify({"error": "Hesap bulunamadı, tekrar giriş yapmalısınız"}), 401


def role_required(*roles):
    """Endpoint'i hem JWT hem de rol kontrolüyle korur, örn:
    @role_required("pharmacist")
    Kullanıcı bulunamazsa veya rolü uymuyorsa 403 döner.
    """

    def decorator(fn):
        @jwt_required()
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user or user.role not in roles:
                return jsonify({"error": "Bu işlem için yetkiniz yok"}), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator
