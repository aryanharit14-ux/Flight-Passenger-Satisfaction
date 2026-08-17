# SkyMetrics — Flight Passenger Satisfaction Analytics & ML Platform

SkyMetrics is a comprehensive data science and analytics platform that predicts flight passenger satisfaction and segments passenger profiles based on real-world survey and flight data. The dashboard features robust machine learning integration, SHAP explainability, and a highly responsive React frontend powered by a Flask REST API backend.

## Problem Statement

Airlines collect massive amounts of feedback and operational data, but often struggle to understand *why* passengers are dissatisfied and *who* their passengers actually are. SkyMetrics solves this by providing:
1. **Satisfaction Prediction**: Accurately predicting whether a passenger is Satisfied or Neutral/Dissatisfied using a highly optimized Random Forest classifier.
2. **Explainability (SHAP)**: Explaining *why* a passenger was predicted as such, by extracting the top 5 contributing features per prediction (e.g., negative impact from poor "Seat Comfort" or "Online Boarding").
3. **Passenger Segmentation**: Grouping passengers into distinct personas using K-Means clustering and projecting them onto a 2D PCA scatter plot.

## Project Features

- Analytics Dashboard
- Passenger satisfaction prediction
- Random Forest & Logistic Regression modeling
- K-Means segmentation & PCA visualization
- SHAP explainability (TreeExplainer)
- Prediction history (SQLite)
- Strict API validation
- SQLite persistence
- Multi-container Docker deployment

## Dashboard Tabs

The application features 8 distinct tabs for complete data visibility:
1. **Overview**: High-level KPIs and metrics.
2. **Services**: Service satisfaction distributions.
3. **Operations**: Delay and operational impact metrics.
4. **Insights**: Deep-dive analytics.
5. **Data**: Raw dataset explorer.
6. **Predict**: Interactive prediction form with SHAP explainability and historical results.
7. **Segments**: K-Means clustering form and interactive 2D PCA visualization.
8. **ML Performance**: Live evaluation metrics of the active machine learning models.

## Dataset

The model is trained on a robust flight passenger satisfaction dataset. 
- **Categorical Features**: `Gender`, `Customer Type`, `Type of Travel`, `Class`.
- **Numerical Features**: `Age`, `Flight Distance`, `Departure Delay`, `Arrival Delay`, and 14 distinct survey ratings (scale 0-5) including `Departure and Arrival Time Convenience`, `Ease of Online Booking`, `Check-in Service`, `Online Boarding`, `Gate Location`, `On-board Service`, `Seat Comfort`, `Leg Room Service`, `Cleanliness`, `Food and Drink`, `In-flight Service`, `In-flight Wifi Service`, `In-flight Entertainment`, and `Baggage Handling`.
- **Target**: Satisfied (1) vs. Neutral or Dissatisfied (0).

## Architecture

```text
React / Vite (Frontend)
         ↓  (HTTP API / JSON)
Flask REST API (Backend)
         ↓
scikit-learn (Machine Learning layer)
         ↓
SQLite (skymetrics.db)
```

The production architecture is completely Dockerized:
- **Frontend**: Nginx serving statically compiled React assets.
- **Backend**: Gunicorn WSGI server running the Flask API on Python 3.12.
- **Database**: Persistent Docker volume (`backend_data`) mapping SQLite for permanent history storage.

## Machine Learning

The ML pipeline involves:
- **Preprocessing**: Custom `ColumnTransformer` applying `OneHotEncoder` to categorical features and `StandardScaler` to numerical ones.
- **Supervised Models**: `RandomForestClassifier` (primary) and `LogisticRegression` (baseline).
- **Unsupervised Models**: `KMeans` (clustering) and `PCA` (dimensionality reduction).

### Current Random Forest Metrics (Verified)

The production Random Forest model was heavily optimized to reduce latency. The model size was reduced from ~161 MB to ~39 MB (`n_estimators=50`, `max_depth=None`, `min_samples_leaf=1`) with minimal impact on F1 scores.

- **Accuracy**: 0.9617
- **Precision**: 0.9760
- **Recall**: 0.9348
- **F1 Score**: 0.9550

### Explainability

Model explainability is provided by the `shap` package using `TreeExplainer` on the Random Forest. Explanations are strictly localized to the individual passenger's prediction and highlight the top 5 positive or negative feature contributions to the final probability. 

## Database Schema

SQLite (`skymetrics.db`) is used for history persistence.
- **`satisfaction_predictions`**: Stores timestamp, full passenger JSON input, prediction label, satisfied/dissatisfied probabilities, model used, and the top 5 SHAP features.
- **`cluster_predictions`**: Stores timestamp, full passenger JSON input, assigned cluster ID, and calculated PCA (x, y) coordinates.

## API Documentation

### `GET /api/health`
Checks server status and model loading.
**Response**: `{"models_loaded": true, "status": "ok"}`

### `GET /api/model-info`
Retrieves training metrics and feature importances for the supervised models.

### `GET /api/analytics`
Retrieves clustering sizes, coordinates, and average feature characteristics.

### `POST /api/predict`
Predicts satisfaction for a single passenger.
**Request**: JSON payload containing all 22 required features.
**Response**:
```json
{
  "model_used": "Random Forest",
  "prediction": "Neutral or Dissatisfied",
  "prediction_label": 0,
  "probability_dissatisfied": 0.8,
  "probability_satisfied": 0.2,
  "top_contributing_features": [
    { "contribution": -0.1466, "direction": "negative", "feature": "Online Boarding" }
    ...
  ]
}
```

### `POST /api/cluster`
Segments a passenger into a K-Means cluster and reduces dimensions via PCA.
**Response**:
```json
{
  "cluster_id": 1,
  "pca_x": -0.3812,
  "pca_y": -0.0899
}
```

### `GET /api/history/predict` & `GET /api/history/cluster`
Returns the 10 most recent predictions from the SQLite database.

## Validation

The API employs strict backend validation prior to inference or database insertion:
- Ensures all 22 required fields are present.
- Rejects unexpected fields and `null` values.
- Enforces exact dataset categorical strings (e.g. `Type of Travel` must be `Business` or `Personal`).
- Enforces dataset numerical bounds (e.g. survey answers strictly `0-5`, `Age` >= 7).
- Enforces correct datatypes (`int`/`float`/`str`).
- Protects against malformed JSON payloads.

## Testing

Verified test suites:
- **Pytest**: `pytest test_app.py -v` (11/11 tests PASSED)
- **Frontend Build**: `npm run build` (PASSED)
- **Docker E2E**: Multi-container stack (PASSED)

## Docker Setup

To run the full production stack:
```bash
docker compose build
docker compose up -d
```
The database persists in the `backend_data` Docker volume. To stop the stack:
```bash
docker compose down
```

## Local Development

Existing workflows are perfectly preserved:
- **Frontend**: `npm run dev`
- **Backend**: `venv/bin/python app.py`

## Project Structure

```text
flight-dashboard/
├── backend/
│   ├── models/                # Serialized .joblib and .json files
│   ├── app.py                 # Flask REST API entrypoint
│   ├── db.py                  # SQLite management
│   ├── preprocessing.py       # ML Pipeline configuration
│   ├── train_models.py        # ML training script
│   ├── test_app.py            # Pytest test suite
│   ├── Dockerfile             # Python 3.12 Gunicorn image
│   └── .env.example
├── src/
│   ├── components/            # React UI components
│   ├── pages/                 # React page views
│   ├── services/api.js        # API interaction layer
│   └── App.jsx                # Main React Router
├── Dockerfile                 # Multi-stage Node 22 + Nginx image
├── docker-compose.yml         # Container orchestration
└── package.json
```

## Future Improvements

While fully functional, future scaling could introduce:
- Authentication/authorization.
- A cloud database migration (e.g., PostgreSQL).
- CI/CD pipelines via GitHub Actions.
- Cloud deployment (AWS/GCP).
- Automated model retraining based on new data ingestion.
- Production model monitoring.
