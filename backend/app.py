"""
app.py
------
Flask REST API for SkyMetrics ML backend.

Endpoints:
  POST /api/predict      — Predict passenger satisfaction
  POST /api/cluster      — Predict passenger cluster
  GET  /api/model-info   — Supervised model metrics
  GET  /api/analytics    — Cluster analytics

CORS is enabled for http://localhost:5173 (Vite dev server).

IMPORTANT: Run `python train_models.py` first to generate model files.
"""

import os
import json
import traceback

from dotenv import load_dotenv
load_dotenv()

import numpy as np
import pandas as pd
import joblib
import shap
from flask import Flask, request, jsonify
from flask_cors import CORS

from preprocessing import (
    ALL_FEATURES, CATEGORICAL_FEATURES, NUMERICAL_FEATURES,
    TARGET_MAP_INV,
)
import db

# ── App Setup ─────────────────────────────────────────────────────────────────
app = Flask(__name__)

frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")
CORS(app, origins=[frontend_url, "http://127.0.0.1:5173"])

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR  = os.path.join(SCRIPT_DIR, "models")

try:
    db.init_db()
    print("✓ Database initialized successfully")
except Exception as e:
    print(f"\n⚠ WARNING: DB Init Failed: {e}\n")

# ── Load Models at Startup ────────────────────────────────────────────────────
def load_models():
    required = [
        "preprocessor.joblib",
        "classifier.joblib",
        "model_info.json",
        "kmeans_preprocessor.joblib",
        "kmeans.joblib",
        "pca.joblib",
        "cluster_info.json",
    ]
    missing = [f for f in required if not os.path.exists(os.path.join(MODELS_DIR, f))]
    if missing:
        raise FileNotFoundError(
            f"Missing model files: {missing}\n"
            f"Run: python train_models.py"
        )

    models = {
        "preprocessor":       joblib.load(os.path.join(MODELS_DIR, "preprocessor.joblib")),
        "classifier":         joblib.load(os.path.join(MODELS_DIR, "classifier.joblib")),
        "kmeans_preprocessor":joblib.load(os.path.join(MODELS_DIR, "kmeans_preprocessor.joblib")),
        "kmeans":             joblib.load(os.path.join(MODELS_DIR, "kmeans.joblib")),
        "pca":                joblib.load(os.path.join(MODELS_DIR, "pca.joblib")),
    }

    with open(os.path.join(MODELS_DIR, "model_info.json")) as f:
        models["model_info"] = json.load(f)

    with open(os.path.join(MODELS_DIR, "cluster_info.json")) as f:
        models["cluster_info"] = json.load(f)

    # Initialize SHAP explainer
    models["explainer"] = shap.TreeExplainer(models["classifier"])
    
    # Extract clean feature names
    raw_names = models["preprocessor"].get_feature_names_out()
    clean_names = [n.replace("cat__", "").replace("num__", "").replace("_", " ") for n in raw_names]
    models["feature_names"] = np.array(clean_names)

    return models


try:
    MODELS = load_models()
    print("✓ All models loaded successfully")
except FileNotFoundError as e:
    print(f"\n⚠ WARNING: {e}\n")
    MODELS = None


# ── Validation ────────────────────────────────────────────────────────────────

VALID_CATEGORIES = {
    "Gender":         ["Female", "Male"],
    "Customer Type":  ["First-time", "Returning"],
    "Type of Travel": ["Business", "Personal"],
    "Class":          ["Business", "Economy", "Economy Plus"],
}

NUMERICAL_RANGES = {
    "Age":                    (7, 85),
    "Flight Distance":        (31, 4983),
    "Departure Delay":        (0, 1592),
    "Arrival Delay":          (0, 1584),
    # Service ratings 0-5
    "Departure and Arrival Time Convenience": (0, 5),
    "Ease of Online Booking":  (0, 5),
    "Check-in Service":        (0, 5),
    "Online Boarding":         (0, 5),
    "Gate Location":           (0, 5),
    "On-board Service":        (0, 5),
    "Seat Comfort":            (0, 5),
    "Leg Room Service":        (0, 5),
    "Cleanliness":             (0, 5),
    "Food and Drink":          (0, 5),
    "In-flight Service":       (0, 5),
    "In-flight Wifi Service":  (0, 5),
    "In-flight Entertainment": (0, 5),
    "Baggage Handling":        (1, 5),
}


def parse_and_validate(data: dict) -> tuple[pd.DataFrame, dict]:
    """
    Parse JSON request body into a single-row DataFrame with ALL_FEATURES.
    Returns (df, errors). errors is an empty dict if valid.
    """
    errors = {}
    if not data:
        return None, {"error": "Request body cannot be empty."}

    parsed = {}
    
    # Check for unexpected fields
    for k in data.keys():
        if k not in CATEGORICAL_FEATURES and k not in NUMERICAL_FEATURES:
            errors[k] = "Unexpected field."

    # Categorical fields
    for col in CATEGORICAL_FEATURES:
        val = data.get(col)
        if val is None or str(val).strip() == "":
            errors[col] = "Field is required."
        elif not isinstance(val, str):
            errors[col] = "Invalid type. Expected string."
        elif val not in VALID_CATEGORIES[col]:
            errors[col] = f"Invalid value. Expected one of: {', '.join(VALID_CATEGORIES[col])}."
        else:
            parsed[col] = val.strip()

    # Numerical fields
    for col in NUMERICAL_FEATURES:
        val = data.get(col)
        if val is None or str(val).strip() == "":
            errors[col] = "Field is required."
        else:
            try:
                # Disallow boolean types which isinstance(val, int) evaluates to True for
                if isinstance(val, bool):
                    raise TypeError("Booleans not allowed")
                f_val = float(val)
                lo, hi = NUMERICAL_RANGES[col]
                if not (lo <= f_val <= hi):
                    errors[col] = f"Invalid value. Expected a number between {lo} and {hi}."
                else:
                    parsed[col] = f_val
            except (ValueError, TypeError):
                errors[col] = "Invalid type. Expected a number."

    if errors:
        return None, errors

    df = pd.DataFrame([parsed], columns=ALL_FEATURES)
    return df, {}


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "models_loaded": MODELS is not None,
    })


@app.route("/api/predict", methods=["POST"])
def predict():
    """
    Predict passenger satisfaction.

    Request body (JSON): all ALL_FEATURES as key-value pairs.
    Response:
      prediction        : "Satisfied" | "Neutral or Dissatisfied"
      prediction_label  : 1 | 0
      probability_satisfied : float  (probability of Satisfied class)
      probability_dissatisfied : float
      model_used        : str
    """
    if MODELS is None:
        return jsonify({"error": "Models not loaded. Run python train_models.py first."}), 503

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    df, errors = parse_and_validate(data)
    if errors:
        return jsonify({"error": "Validation failed.", "details": errors}), 422

    try:
        X_t = MODELS["preprocessor"].transform(df)
        label = int(MODELS["classifier"].predict(X_t)[0])
        proba = MODELS["classifier"].predict_proba(X_t)[0]  # [P(0), P(1)]

        prob_sat  = round(float(proba[1]), 4)
        prob_dis  = round(float(proba[0]), 4)
        pred_text = TARGET_MAP_INV[label]

        # Calculate SHAP values
        shap_vals = MODELS["explainer"].shap_values(X_t)
        # For a binary Random Forest, shap_values is shape (1, n_features, 2)
        # We want the values for class 1 (Satisfied)
        class_1_shap = shap_vals[0, :, 1]
        
        # Get top 5 features by absolute contribution
        top_indices = np.argsort(np.abs(class_1_shap))[::-1][:5]
        
        explanations = []
        for idx in top_indices:
            val = float(class_1_shap[idx])
            explanations.append({
                "feature": str(MODELS["feature_names"][idx]),
                "contribution": round(val, 4),
                "direction": "positive" if val > 0 else "negative"
            })

        result_data = {
            "prediction":              pred_text,
            "prediction_label":        label,
            "probability_satisfied":   prob_sat,
            "probability_dissatisfied": prob_dis,
            "model_used":              MODELS["model_info"]["best_model"],
            "top_contributing_features": explanations,
        }
        
        try:
            db.save_satisfaction(data, result_data)
        except Exception as e:
            print(f"Warning: Failed to save prediction history: {e}")

        return jsonify(result_data)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


@app.route("/api/history/predict", methods=["GET"])
def predict_history():
    try:
        limit = request.args.get("limit", default=10, type=int)
        history = db.get_satisfaction_history(limit=limit)
        return jsonify(history)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Failed to fetch history: {str(e)}"}), 500


@app.route("/api/cluster", methods=["POST"])
def cluster():
    """
    Predict the passenger segment (cluster).

    Request body (JSON): same fields as /api/predict (Satisfaction not needed).
    Response:
      cluster_id   : int
      pca_x        : float
      pca_y        : float
      cluster_size : int
      characteristics : dict of median feature values for that cluster
    """
    if MODELS is None:
        return jsonify({"error": "Models not loaded. Run python train_models.py first."}), 503

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    df, errors = parse_and_validate(data)
    if errors:
        return jsonify({"error": "Validation failed.", "details": errors}), 422

    try:
        X_t = MODELS["kmeans_preprocessor"].transform(df)
        cluster_id = int(MODELS["kmeans"].predict(X_t)[0])
        pca_coords = MODELS["pca"].transform(X_t)[0]

        ci = MODELS["cluster_info"]
        chars = ci["cluster_chars"].get(str(cluster_id), {})
        size  = ci["cluster_sizes"].get(str(cluster_id), 0)

        result_data = {
            "cluster_id":      cluster_id,
            "pca_x":           round(float(pca_coords[0]), 4),
            "pca_y":           round(float(pca_coords[1]), 4),
            "cluster_size":    size,
            "characteristics": chars,
        }

        try:
            db.save_cluster(data, result_data)
        except Exception as e:
            print(f"Warning: Failed to save cluster history: {e}")

        return jsonify(result_data)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Cluster prediction failed: {str(e)}"}), 500

@app.route("/api/history/cluster", methods=["GET"])
def cluster_history():
    try:
        limit = request.args.get("limit", default=10, type=int)
        history = db.get_cluster_history(limit=limit)
        return jsonify(history)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Failed to fetch history: {str(e)}"}), 500


@app.route("/api/model-info", methods=["GET"])
def model_info():
    """
    Return model comparison metrics (both LR and RF).
    """
    if MODELS is None:
        return jsonify({"error": "Models not loaded. Run python train_models.py first."}), 503
    return jsonify(MODELS["model_info"])


@app.route("/api/analytics", methods=["GET"])
def analytics():
    """
    Return clustering analytics: sizes, silhouette, PCA scatter, characteristics.
    """
    if MODELS is None:
        return jsonify({"error": "Models not loaded. Run python train_models.py first."}), 503
    return jsonify(MODELS["cluster_info"])


# ── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    host = os.environ.get("FLASK_HOST", "0.0.0.0")
    port = int(os.environ.get("FLASK_PORT", 5001))
    debug = os.environ.get("FLASK_ENV", "development") == "development"
    app.run(host=host, port=port, debug=debug)
