"""
MedLoop Backend - Paylaşılan uzantı (extension) örnekleri
==========================================================
Circular import sorunlarını önlemek için db/jwt/migrate/scheduler burada
tanımlanır; app.py içinde init_app() ile bağlanır, diğer modüller
(models.py, routes'lar) buradan import eder.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from apscheduler.schedulers.background import BackgroundScheduler

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()
scheduler = BackgroundScheduler()
