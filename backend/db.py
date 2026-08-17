import sqlite3
import json
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), 'skymetrics.db'))

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Satisfaction predictions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS satisfaction_predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                passenger_input TEXT NOT NULL,
                prediction TEXT NOT NULL,
                prediction_label INTEGER NOT NULL,
                probability_satisfied REAL NOT NULL,
                probability_dissatisfied REAL NOT NULL,
                model_used TEXT NOT NULL,
                shap_features TEXT
            )
        ''')
        
        # Cluster predictions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cluster_predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                passenger_input TEXT NOT NULL,
                cluster_id INTEGER NOT NULL,
                pca_x REAL NOT NULL,
                pca_y REAL NOT NULL
            )
        ''')
        
        # Indexes for fast retrieval of latest
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sat_time ON satisfaction_predictions (timestamp DESC)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_clus_time ON cluster_predictions (timestamp DESC)')
        
        conn.commit()

def save_satisfaction(input_data, result_data):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO satisfaction_predictions 
            (timestamp, passenger_input, prediction, prediction_label, 
             probability_satisfied, probability_dissatisfied, model_used, shap_features)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            datetime.utcnow().isoformat() + "Z",
            json.dumps(input_data),
            result_data['prediction'],
            result_data['prediction_label'],
            result_data['probability_satisfied'],
            result_data['probability_dissatisfied'],
            result_data['model_used'],
            json.dumps(result_data.get('top_contributing_features', []))
        ))
        conn.commit()
        return cursor.lastrowid

def get_satisfaction_history(limit=10):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM satisfaction_predictions ORDER BY timestamp DESC LIMIT ?', (limit,))
        rows = cursor.fetchall()
        
        history = []
        for row in rows:
            history.append({
                'id': row['id'],
                'timestamp': row['timestamp'],
                'passenger_input': json.loads(row['passenger_input']),
                'prediction': row['prediction'],
                'prediction_label': row['prediction_label'],
                'probability_satisfied': row['probability_satisfied'],
                'probability_dissatisfied': row['probability_dissatisfied'],
                'model_used': row['model_used'],
                'shap_features': json.loads(row['shap_features']) if row['shap_features'] else []
            })
        return history

def save_cluster(input_data, result_data):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO cluster_predictions 
            (timestamp, passenger_input, cluster_id, pca_x, pca_y)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            datetime.utcnow().isoformat() + "Z",
            json.dumps(input_data),
            result_data['cluster_id'],
            result_data['pca_x'],
            result_data['pca_y']
        ))
        conn.commit()
        return cursor.lastrowid

def get_cluster_history(limit=10):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM cluster_predictions ORDER BY timestamp DESC LIMIT ?', (limit,))
        rows = cursor.fetchall()
        
        history = []
        for row in rows:
            history.append({
                'id': row['id'],
                'timestamp': row['timestamp'],
                'passenger_input': json.loads(row['passenger_input']),
                'cluster_id': row['cluster_id'],
                'pca_x': row['pca_x'],
                'pca_y': row['pca_y']
            })
        return history
