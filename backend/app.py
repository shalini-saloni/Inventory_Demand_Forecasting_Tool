import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import config
from models import db


def create_app(env: str = "development") -> Flask:
    app = Flask(__name__)
    app.config.from_object(config[env])

    # Extensions
    db.init_app(app)
    CORS(app, origins=["http://localhost:5173", "http://localhost:3000"],
         supports_credentials=True)
    jwt = JWTManager(app)

    # ── JWT error handlers ────────────────────────────────────────────────
    @jwt.unauthorized_loader
    def missing_token(reason):
        return jsonify({"error": "Missing or invalid token.", "reason": reason}), 401

    @jwt.expired_token_loader
    def expired_token(jwt_header, jwt_data):
        return jsonify({"error": "Token has expired."}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        return jsonify({"error": "Invalid token.", "reason": reason}), 422

    # ── Blueprints ────────────────────────────────────────────────────────
    from routes.auth      import auth_bp
    from routes.items     import items_bp
    from routes.forecast  import forecast_bp
    from routes.restock   import restock_bp
    from routes.dashboard import dashboard_bp

    for bp in (auth_bp, items_bp, forecast_bp, restock_bp, dashboard_bp):
        app.register_blueprint(bp)

    # ── Health check ──────────────────────────────────────────────────────
    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "env": env}), 200

    # ── Global error handlers ─────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found."}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error."}), 500

    # ── DB init ───────────────────────────────────────────────────────────
    with app.app_context():
        db.create_all()
        os.makedirs(app.config.get("UPLOAD_FOLDER", "uploads"), exist_ok=True)

    return app


if __name__ == "__main__":
    app = create_app("development")
    app.run(host="0.0.0.0", port=8000, debug=True)
