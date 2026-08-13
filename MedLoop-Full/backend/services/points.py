"""MedLoop Backend - Puan (gamification) servisi."""

from flask import current_app

from extensions import db


def award_points_for_delivery(user) -> int:
    """Eczaneye teslim edilen tek bir ilaç için kullanıcıya puan ekler ve
    kazanılan puan miktarını döndürür."""
    amount = current_app.config.get("POINTS_PER_DELIVERY", 10)
    user.points = (user.points or 0) + amount
    db.session.add(user)
    db.session.commit()
    return amount


def award_points_for_deliveries(user, item_count: int) -> int:
    """QR ile aynı anda teslim edilen birden fazla ilaç için toplam puanı
    (ilaç başına POINTS_PER_DELIVERY) ekler ve kazanılan toplam puanı
    döndürür."""
    per_item = current_app.config.get("POINTS_PER_DELIVERY", 10)
    amount = per_item * max(item_count, 0)
    user.points = (user.points or 0) + amount
    db.session.add(user)
    db.session.commit()
    return amount
