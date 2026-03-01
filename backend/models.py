from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id         = db.Column(db.Integer, primary_key=True)
    username   = db.Column(db.String(80), unique=True, nullable=False)
    email      = db.Column(db.String(120), unique=True, nullable=False)
    password   = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":         self.id,
            "username":   self.username,
            "email":      self.email,
            "created_at": self.created_at.isoformat(),
        }


class Item(db.Model):
    __tablename__ = "items"

    id            = db.Column(db.Integer, primary_key=True)
    item_id       = db.Column(db.String(100), nullable=False)
    store_id      = db.Column(db.String(100), nullable=False)
    current_stock = db.Column(db.Integer, default=300)
    lead_time     = db.Column(db.Integer, default=7)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at    = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("item_id", "store_id", name="uq_item_store"),)

    sales = db.relationship("SalesRecord", backref="item", lazy="dynamic",
                            cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id":            self.id,
            "item_id":       self.item_id,
            "store_id":      self.store_id,
            "current_stock": self.current_stock,
            "lead_time":     self.lead_time,
            "created_at":    self.created_at.isoformat(),
        }


class SalesRecord(db.Model):
    __tablename__ = "sales_records"

    id       = db.Column(db.Integer, primary_key=True)
    item_pk  = db.Column(db.Integer, db.ForeignKey("items.id"), nullable=False)
    date     = db.Column(db.Date, nullable=False)
    sales    = db.Column(db.Float, default=0)
    price    = db.Column(db.Float, nullable=True)
    promo    = db.Column(db.Integer, default=0)
    weekday  = db.Column(db.Integer, nullable=True)
    month    = db.Column(db.Integer, nullable=True)

    def to_dict(self):
        return {
            "id":      self.id,
            "date":    self.date.isoformat(),
            "sales":   self.sales,
            "price":   self.price,
            "promo":   self.promo,
            "weekday": self.weekday,
            "month":   self.month,
        }
