
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Keep the database inside the backend folder.
DATABASE = Path(__file__).resolve().parent / "inventory.db"


def get_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                quantity INTEGER NOT NULL CHECK(quantity >= 0),
                expiry_date TEXT NOT NULL
            )
        """)


@app.route("/")
def home():
    return jsonify({
        "message": "Smart Inventory API is running",
        "status": "success"
    })


@app.route("/api/products", methods=["GET"])
def get_products():
    initialize_database()
    search = request.args.get("q", "").strip()

    with get_connection() as connection:
        if search:
            products = connection.execute("""
                SELECT * FROM products
                WHERE name LIKE ? OR category LIKE ?
                ORDER BY id DESC
            """, (f"%{search}%", f"%{search}%")).fetchall()
        else:
            products = connection.execute("""
                SELECT * FROM products
                ORDER BY id DESC
            """).fetchall()

    return jsonify([
        {
            "id": product["id"],
            "name": product["name"],
            "category": product["category"],
            "quantity": product["quantity"],
            "expiryDate": product["expiry_date"]
        }
        for product in products
    ])


@app.route("/api/products", methods=["POST"])
def add_product():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Please send valid product data."}), 400

    name = data.get("name")
    category = data.get("category")
    quantity = data.get("quantity")
    expiry_date = data.get("expiryDate")

    if not all(
        isinstance(value, str) and value.strip()
        for value in (name, category, expiry_date)
    ):
        return jsonify({
            "error": "Name, category, and expiry date are required."
        }), 400

    if len(name.strip()) > 100 or len(category.strip()) > 60:
        return jsonify({"error": "Name or category is too long."}), 400

    # Reject invalid dates, but allow dates in the past.
    try:
        from datetime import date
        date.fromisoformat(expiry_date)
    except ValueError:
        return jsonify({"error": "Please enter a valid expiry date."}), 400

    if isinstance(quantity, bool) or not isinstance(quantity, int):
        return jsonify({"error": "Quantity must be a whole number."}), 400

    if quantity < 0:
        return jsonify({"error": "Quantity cannot be negative."}), 400

    with get_connection() as connection:
        cursor = connection.execute("""
            INSERT INTO products (name, category, quantity, expiry_date)
            VALUES (?, ?, ?, ?)
        """, (name.strip(), category.strip(), quantity, expiry_date))

        product_id = cursor.lastrowid

        product = connection.execute(
            "SELECT * FROM products WHERE id = ?",
            (product_id,)
        ).fetchone()

    return jsonify({
        "id": product["id"],
        "name": product["name"],
        "category": product["category"],
        "quantity": product["quantity"],
        "expiryDate": product["expiry_date"]
    }), 201


@app.route("/api/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM products WHERE id = ?",
            (product_id,)
        )

        if cursor.rowcount == 0:
            return jsonify({"error": "Product not found."}), 404

    return jsonify({"message": "Product deleted successfully."})

initialize_database()

if __name__ == "__main__":
    app.run(debug=True)
