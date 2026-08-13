"""Diğer blueprint'lerin JWT'den mevcut kullanıcıyı çekmesi için ortak yardımcı."""

from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

from models import User


def get_current_user() -> User | None:
    user_id = get_jwt_identity()
    if user_id is None:
        return None
    return User.query.get(int(user_id))


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
