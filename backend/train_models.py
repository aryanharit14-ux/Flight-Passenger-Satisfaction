"""
train_models.py
---------------
One-time training script.  Run this BEFORE starting the Flask server.

Usage:
    python train_models.py

Outputs (all written to ./models/):
    preprocessor.joblib     - fitted ColumnTransformer (shared supervised)
    classifier.joblib       - best classification model (LR or RF)
    model_info.json         - metrics for both models + chosen model name
    kmeans_preprocessor.joblib  - fitted ColumnTransformer (clustering, same columns)
    kmeans.joblib           - fitted KMeans model
    pca.joblib              - fitted PCA(n_components=2)
    cluster_info.json       - silhouette score, cluster sizes, centroids, pca sample
"""

import os
import sys
import json
import time
import warnings

import numpy as np
import pandas as pd
import joblib

from sklearn.linear_model    import LogisticRegression
from sklearn.ensemble        import RandomForestClassifier
from sklearn.cluster         import KMeans
from sklearn.decomposition   import PCA
from sklearn.model_selection import train_test_split
from sklearn.metrics         import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix,
)
from sklearn.metrics         import silhouette_score

from preprocessing import (
    load_data, load_data_unsupervised, build_preprocessor,
    get_feature_names_out,
    CATEGORICAL_FEATURES, NUMERICAL_FEATURES, ALL_FEATURES,
    TARGET_MAP_INV,
)

warnings.filterwarnings("ignore")

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_PATH    = os.path.join(SCRIPT_DIR, "..", "data", "airline_passenger_uncleaned.csv")
MODELS_DIR   = os.path.join(SCRIPT_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)


def path(filename):
    return os.path.join(MODELS_DIR, filename)


# ── Helpers ───────────────────────────────────────────────────────────────────

def evaluate_model(model, X_test_t, y_test):
    y_pred = model.predict(X_test_t)
    y_prob = model.predict_proba(X_test_t)[:, 1]
    cm = confusion_matrix(y_test, y_pred).tolist()
    return {
        "accuracy":  round(float(accuracy_score(y_test, y_pred)),  4),
        "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
        "recall":    round(float(recall_score(y_test, y_pred,    zero_division=0)), 4),
        "f1":        round(float(f1_score(y_test, y_pred,        zero_division=0)), 4),
        "confusion_matrix": cm,        # [[TN, FP], [FN, TP]]
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 1. SUPERVISED LEARNING
# ═══════════════════════════════════════════════════════════════════════════════

def train_supervised():
    print("\n" + "="*60)
    print("SUPERVISED LEARNING")
    print("="*60)

    # Load & split
    print(f"Loading data from: {DATA_PATH}")
    X, y = load_data(DATA_PATH)
    print(f"  Clean samples: {len(X):,}  |  Positive (Satisfied): {y.sum():,}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"  Train: {len(X_train):,}  |  Test: {len(X_test):,}")

    # Fit preprocessor on training data only
    preprocessor = build_preprocessor()
    print("\nFitting ColumnTransformer on training set...")
    X_train_t = preprocessor.fit_transform(X_train)
    X_test_t  = preprocessor.transform(X_test)
    print(f"  Transformed shape: {X_train_t.shape}")

    results = {}

    # ── Logistic Regression ──────────────────────────────────────────────────
    print("\nTraining Logistic Regression (max_iter=500, C=1.0)...")
    t0 = time.time()
    lr = LogisticRegression(max_iter=500, C=1.0, random_state=42, n_jobs=-1)
    lr.fit(X_train_t, y_train)
    lr_time = round(time.time() - t0, 2)
    lr_metrics = evaluate_model(lr, X_test_t, y_test)
    results["Logistic Regression"] = {**lr_metrics, "train_time_s": lr_time}
    print(f"  Accuracy={lr_metrics['accuracy']:.4f}  F1={lr_metrics['f1']:.4f}  ({lr_time}s)")

    # ── Random Forest ────────────────────────────────────────────────────────
    print("\nTraining Random Forest (n_estimators=50, n_jobs=-1)...")
    t0 = time.time()
    rf = RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=-1)
    rf.fit(X_train_t, y_train)
    rf_time = round(time.time() - t0, 2)
    rf_metrics = evaluate_model(rf, X_test_t, y_test)
    results["Random Forest"] = {**rf_metrics, "train_time_s": rf_time}
    print(f"  Accuracy={rf_metrics['accuracy']:.4f}  F1={rf_metrics['f1']:.4f}  ({rf_time}s)")

    # ── Model selection ──────────────────────────────────────────────────────
    best_name = max(results, key=lambda k: results[k]["f1"])
    best_model = lr if best_name == "Logistic Regression" else rf
    print(f"\nBest model: {best_name} (F1={results[best_name]['f1']:.4f})")

    # Feature importances (Random Forest)
    feat_names = get_feature_names_out(preprocessor)
    if hasattr(best_model, "feature_importances_"):
        importances = best_model.feature_importances_.tolist()
    else:
        importances = list(abs(best_model.coef_[0]))
    feat_importance = sorted(
        zip(feat_names, importances), key=lambda x: -x[1]
    )[:15]
    feat_importance = [
        {"feature": f, "importance": round(float(v), 6)}
        for f, v in feat_importance
    ]

    # ── Save ──────────────────────────────────────────────────────────────────
    joblib.dump(preprocessor, path("preprocessor.joblib"))
    joblib.dump(best_model,   path("classifier.joblib"))

    model_info = {
        "best_model":  best_name,
        "models":      results,
        "feature_importance": feat_importance,
        "feature_columns": ALL_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "numerical_features":   NUMERICAL_FEATURES,
        "target_classes": {str(v): k for k, v in {
            "Satisfied": 1, "Neutral or Dissatisfied": 0
        }.items()},
        "test_size": len(X_test),
        "train_size": len(X_train),
    }
    with open(path("model_info.json"), "w") as f:
        json.dump(model_info, f, indent=2)

    print(f"\nSaved: preprocessor.joblib, classifier.joblib, model_info.json")
    print("SUPERVISED LEARNING COMPLETE ✓")
    return preprocessor, best_model, model_info


# ═══════════════════════════════════════════════════════════════════════════════
# 2. UNSUPERVISED LEARNING (K-Means)
# ═══════════════════════════════════════════════════════════════════════════════

def train_unsupervised():
    print("\n" + "="*60)
    print("UNSUPERVISED LEARNING (K-Means)")
    print("="*60)

    print(f"Loading unsupervised data from: {DATA_PATH}")
    X = load_data_unsupervised(DATA_PATH)
    print(f"  Samples: {len(X):,}")

    # Use the SAME ColumnTransformer structure (different fitted instance)
    kmeans_preprocessor = build_preprocessor()
    print("Fitting ColumnTransformer for clustering...")
    X_t = kmeans_preprocessor.fit_transform(X)
    print(f"  Transformed shape: {X_t.shape}")

    # ── K-Means ──────────────────────────────────────────────────────────────
    N_CLUSTERS = 4
    print(f"\nTraining KMeans(n_clusters={N_CLUSTERS})...")
    t0 = time.time()
    kmeans = KMeans(n_clusters=N_CLUSTERS, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_t)
    km_time = round(time.time() - t0, 2)
    print(f"  Done in {km_time}s")

    # Silhouette score on 20k sample (full dataset is huge)
    print("Computing silhouette score on 20K sample...")
    rng = np.random.default_rng(42)
    sample_idx = rng.choice(len(X_t), size=min(20000, len(X_t)), replace=False)
    sil = silhouette_score(X_t[sample_idx], labels[sample_idx])
    print(f"  Silhouette score: {sil:.4f}")

    # ── PCA (2D) for visualization ───────────────────────────────────────────
    print("Fitting PCA(n_components=2)...")
    pca = PCA(n_components=2, random_state=42)
    X_pca = pca.fit_transform(X_t)
    print(f"  Explained variance ratio: {pca.explained_variance_ratio_}")

    # Sample 1000 points for the scatter plot payload
    scatter_idx = rng.choice(len(X_pca), size=min(1000, len(X_pca)), replace=False)
    scatter_pts = [
        {
            "x":       round(float(X_pca[i, 0]), 4),
            "y":       round(float(X_pca[i, 1]), 4),
            "cluster": int(labels[i]),
        }
        for i in scatter_idx
    ]

    # ── Cluster sizes ─────────────────────────────────────────────────────────
    unique, counts = np.unique(labels, return_counts=True)
    cluster_sizes = {int(k): int(v) for k, v in zip(unique, counts)}
    print(f"  Cluster sizes: {cluster_sizes}")

    # ── Cluster characteristics: mean of original numeric features ─────────
    X_df = X.copy()
    X_df["_cluster"] = labels
    cluster_chars = {}
    for cid in range(N_CLUSTERS):
        subset = X_df[X_df["_cluster"] == cid]
        char = {}
        for col in NUMERICAL_FEATURES:
            char[col] = round(float(subset[col].median(skipna=True)), 2)
        # Most frequent category per cluster
        for col in CATEGORICAL_FEATURES:
            char[col] = subset[col].mode()[0] if not subset[col].mode().empty else "Unknown"
        cluster_chars[cid] = char

    # ── Centroid feature names ────────────────────────────────────────────────
    feat_names = get_feature_names_out(kmeans_preprocessor)
    centroid_list = []
    for i, c in enumerate(kmeans.cluster_centers_):
        centroid_list.append({
            "cluster": i,
            "size":    cluster_sizes.get(i, 0),
        })

    # ── Save ──────────────────────────────────────────────────────────────────
    joblib.dump(kmeans_preprocessor, path("kmeans_preprocessor.joblib"))
    joblib.dump(kmeans,              path("kmeans.joblib"))
    joblib.dump(pca,                 path("pca.joblib"))

    cluster_info = {
        "n_clusters":       N_CLUSTERS,
        "silhouette_score": round(float(sil), 4),
        "cluster_sizes":    cluster_sizes,
        "cluster_chars":    cluster_chars,
        "scatter_sample":   scatter_pts,
        "pca_variance":     [round(float(v), 4) for v in pca.explained_variance_ratio_],
    }
    with open(path("cluster_info.json"), "w") as f:
        json.dump(cluster_info, f, indent=2)

    print("Saved: kmeans_preprocessor.joblib, kmeans.joblib, pca.joblib, cluster_info.json")
    print("UNSUPERVISED LEARNING COMPLETE ✓")
    return cluster_info


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    total_start = time.time()

    print("SkyMetrics — Model Training Script")
    print(f"Data path: {DATA_PATH}")

    if not os.path.exists(DATA_PATH):
        print(f"\nERROR: Dataset not found at {DATA_PATH}")
        sys.exit(1)

    supervised_result   = train_supervised()
    unsupervised_result = train_unsupervised()

    total = round(time.time() - total_start, 1)
    print(f"\n{'='*60}")
    print(f"ALL TRAINING COMPLETE in {total}s")
    print(f"Models saved to: {MODELS_DIR}")
    print("="*60)
