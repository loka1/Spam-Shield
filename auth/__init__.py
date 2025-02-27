from flask_jwt_extended import JWTManager
from .routes import auth_ns

jwt = JWTManager()

def init_app(app):
    jwt.init_app(app) 