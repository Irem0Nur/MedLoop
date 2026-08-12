"""Diğer blueprint'lerin JWT'den mevcut kullanıcıyı çekmesi için ortak yardımcı."""

from flask_jwt_extended import get_jwt_identity

from models import User


def get_current_user() -> User | None:
    user_id = get_jwt_identity()
    if user_id is None:
        return None
    return User.query.get(int(user_id))
