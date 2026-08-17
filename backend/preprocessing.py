"""
preprocessing.py
----------------
Single source of truth for all feature definitions and the shared
sklearn ColumnTransformer pipeline used in BOTH supervised and
unsupervised workflows.

Dataset: airline_passenger_uncleaned.csv
Confirmed column names and values from direct inspection (2026-08-17).
"""

import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer

# ── Column Definitions (confirmed from dataset inspection) ──────────────────

# Excluded: 'ID' (row identifier), 'Satisfaction' (target)
TARGET_COL = "Satisfaction"
ID_COL     = "ID"

# Target encoding (confirmed unique values after dropping blanks)
TARGET_MAP = {
    "Satisfied":               1,
    "Neutral or Dissatisfied": 0,
}
TARGET_MAP_INV = {v: k for k, v in TARGET_MAP.items()}

# Categorical features and their confirmed unique values (non-blank)
CATEGORICAL_FEATURES = ["Gender", "Customer Type", "Type of Travel", "Class"]
CATEGORICAL_CATEGORIES = {
    "Gender":          ["Female", "Male"],
    "Customer Type":   ["First-time", "Returning"],
    "Type of Travel":  ["Business", "Personal"],
    "Class":           ["Business", "Economy", "Economy Plus"],
}

# Numerical features (Age + distance/delay + 14 service ratings, all 0–5 or wider)
NUMERICAL_FEATURES = [
    "Age",
    "Flight Distance",
    "Departure Delay",
    "Arrival Delay",
    "Departure and Arrival Time Convenience",
    "Ease of Online Booking",
    "Check-in Service",
    "Online Boarding",
    "Gate Location",
    "On-board Service",
    "Seat Comfort",
    "Leg Room Service",
    "Cleanliness",
    "Food and Drink",
    "In-flight Service",
    "In-flight Wifi Service",
    "In-flight Entertainment",
    "Baggage Handling",
]

ALL_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES

# ── Data Loading ────────────────────────────────────────────────────────────

def load_data(csv_path: str) -> tuple[pd.DataFrame, pd.Series]:
    """
    Load the CSV, drop rows missing critical columns, encode target.
    Returns (X, y) where X contains ALL_FEATURES and y is 0/1.
    """
    df = pd.read_csv(csv_path, dtype=str)

    # Replace empty strings with NaN uniformly
    df.replace("", np.nan, inplace=True)

    # Drop rows where the target or any categorical feature is missing
    critical_cols = [TARGET_COL] + CATEGORICAL_FEATURES
    df.dropna(subset=critical_cols, inplace=True)

    # Drop rows with unknown satisfaction values (only keep mapped values)
    df = df[df[TARGET_COL].isin(TARGET_MAP.keys())]

    # Cast numerical columns to float (service ratings may still have NaN → imputed later)
    for col in NUMERICAL_FEATURES:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    y = df[TARGET_COL].map(TARGET_MAP).astype(int)
    X = df[ALL_FEATURES].copy()

    return X, y


def load_data_unsupervised(csv_path: str) -> pd.DataFrame:
    """
    Load the CSV for clustering — drops target and ID columns,
    drops rows missing any categorical feature (we still need them),
    returns X with ALL_FEATURES (no target).
    """
    df = pd.read_csv(csv_path, dtype=str)
    df.replace("", np.nan, inplace=True)
    df.dropna(subset=CATEGORICAL_FEATURES, inplace=True)

    for col in NUMERICAL_FEATURES:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    return df[ALL_FEATURES].copy()


# ── Pipeline Builder ─────────────────────────────────────────────────────────

def build_preprocessor() -> ColumnTransformer:
    """
    Returns an UNFITTED ColumnTransformer:
      - Categorical → median imputer (shouldn't fire after dropna) + OneHotEncoder
      - Numerical   → median imputer (service ratings can still be NaN) + StandardScaler
    """
    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(
            categories=[CATEGORICAL_CATEGORIES[c] for c in CATEGORICAL_FEATURES],
            handle_unknown="ignore",
            sparse_output=False,
        )),
    ])

    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler()),
    ])

    preprocessor = ColumnTransformer([
        ("cat", cat_pipeline, CATEGORICAL_FEATURES),
        ("num", num_pipeline, NUMERICAL_FEATURES),
    ], remainder="drop")

    return preprocessor


def get_feature_names_out(preprocessor: ColumnTransformer) -> list[str]:
    """
    Return the list of feature names after transformation
    (OHE columns + numerical column names).
    """
    ohe = preprocessor.named_transformers_["cat"]["encoder"]
    cat_names = list(ohe.get_feature_names_out(CATEGORICAL_FEATURES))
    return cat_names + NUMERICAL_FEATURES
