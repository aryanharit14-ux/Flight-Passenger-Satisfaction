import os
import sys
import time
import json
import warnings
import numpy as np
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

from preprocessing import load_data, build_preprocessor

warnings.filterwarnings("ignore")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(SCRIPT_DIR, "..", "data", "airline_passenger_uncleaned.csv")
MODELS_DIR = os.path.join(SCRIPT_DIR, "models")
BASELINE_PATH = os.path.join(MODELS_DIR, "classifier.joblib")

def evaluate_model_comprehensive(model, X_test_t, y_test, model_path=None):
    # Inference time
    t0 = time.time()
    y_pred = model.predict(X_test_t)
    y_prob = model.predict_proba(X_test_t)[:, 1]
    infer_time = time.time() - t0
    
    # Metrics
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    auc = roc_auc_score(y_test, y_prob)
    
    # Size
    size_mb = 0
    if model_path and os.path.exists(model_path):
        size_mb = os.path.getsize(model_path) / (1024 * 1024)
    
    # Tree stats
    n_estimators = model.n_estimators
    max_depth = model.max_depth
    min_samples_leaf = model.min_samples_leaf
    max_features = model.max_features
    
    total_nodes = 0
    if hasattr(model, "estimators_"):
        for est in model.estimators_:
            total_nodes += est.tree_.node_count
            
    return {
        "Accuracy": round(float(acc), 4),
        "Precision": round(float(prec), 4),
        "Recall": round(float(rec), 4),
        "F1": round(float(f1), 4),
        "ROC-AUC": round(float(auc), 4),
        "Size (MB)": round(size_mb, 2),
        "Inference (s)": round(infer_time, 4),
        "n_estimators": n_estimators,
        "max_depth": max_depth if max_depth else "None",
        "min_samples_leaf": min_samples_leaf,
        "max_features": max_features if max_features else "sqrt",
        "total_nodes": total_nodes
    }

def main():
    print("Loading data...")
    X, y = load_data(DATA_PATH)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    preprocessor = build_preprocessor()
    X_train_t = preprocessor.fit_transform(X_train)
    X_test_t = preprocessor.transform(X_test)
    
    results = {}
    
    # 1. Baseline
    print("Evaluating Baseline...")
    baseline_model = joblib.load(BASELINE_PATH)
    results["Baseline (Current)"] = evaluate_model_comprehensive(baseline_model, X_test_t, y_test, BASELINE_PATH)
    
    # Candidates
    candidates = {
        "Candidate A (Shallow)": RandomForestClassifier(n_estimators=100, max_depth=15, min_samples_leaf=1, random_state=42, n_jobs=-1),
        "Candidate B (Few Trees)": RandomForestClassifier(n_estimators=50, max_depth=None, min_samples_leaf=1, random_state=42, n_jobs=-1),
        "Candidate C (Pruned)": RandomForestClassifier(n_estimators=100, max_depth=20, min_samples_leaf=4, random_state=42, n_jobs=-1),
        "Candidate D (Aggressive Pruning)": RandomForestClassifier(n_estimators=50, max_depth=15, min_samples_leaf=5, random_state=42, n_jobs=-1),
    }
    
    for name, model in candidates.items():
        print(f"Training {name}...")
        model.fit(X_train_t, y_train)
        temp_path = os.path.join(MODELS_DIR, "temp_cand.joblib")
        joblib.dump(model, temp_path)
        results[name] = evaluate_model_comprehensive(model, X_test_t, y_test, temp_path)
        os.remove(temp_path)
        
    print("\n--- RESULTS ---\n")
    print(f"{'Model':<35} | {'Acc':<6} | {'Prec':<6} | {'Recall':<6} | {'F1':<6} | {'AUC':<6} | {'Size MB':<8} | {'Infer s':<8} | {'Nodes':<8}")
    print("-" * 105)
    for name, res in results.items():
        print(f"{name:<35} | {res['Accuracy']:<6.4f} | {res['Precision']:<6.4f} | {res['Recall']:<6.4f} | {res['F1']:<6.4f} | {res['ROC-AUC']:<6.4f} | {res['Size (MB)']:<8.2f} | {res['Inference (s)']:<8.4f} | {res['total_nodes']:<8}")

if __name__ == "__main__":
    main()
