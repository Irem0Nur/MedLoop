"""MedLoop Backend - Puan (gamification) servisi."""

from flask import current_app

from extensions import db


def award_points_for_delivery(user) -> int:
    """Eczaneye teslim edilen bir ilaç için kullanıcıya puan ekler ve
    kazanılan puan miktarını döndürür."""
    amount = current_app.config.get("POINTS_PER_DELIVERY", 10)
    user.points = (user.points or 0) + amount
    db.session.add(user)
    db.session.commit()
    return amount
