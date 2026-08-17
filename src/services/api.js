/**
 * api.js — SkyMetrics Flask API client
 * All ML requests route to Flask on :5001
 */

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api';
const TIMEOUT_MS = 30000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    const json = await res.json();
    if (!res.ok) {
      const msg = json?.error || json?.message || `HTTP ${res.status}`;
      const details = json?.details ? "\n" + json.details.join("\n") : "";
      throw new Error(msg + details);
    }
    return json;
  } catch (err) {
    clearTimeout(id);
    if (err.name === "AbortError") throw new Error("Request timed out (30s)");
    throw err;
  }
}

/**
 * POST /api/predict
 * @param {Object} formData — all 22 feature fields
 * @returns {{ prediction, prediction_label, probability_satisfied, probability_dissatisfied, model_used }}
 */
export async function predictSatisfaction(formData) {
  return fetchWithTimeout(`${BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
}

/**
 * POST /api/cluster
 * @param {Object} formData — same 22 feature fields (no satisfaction)
 * @returns {{ cluster_id, pca_x, pca_y, cluster_size, characteristics }}
 */
export async function predictCluster(formData) {
  return fetchWithTimeout(`${BASE}/cluster`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
}

/**
 * GET /api/history/predict
 * @param {number} limit 
 * @returns {Array} List of past predictions
 */
export async function getPredictHistory(limit = 5) {
  return fetchWithTimeout(`${BASE}/history/predict?limit=${limit}`);
}

/**
 * GET /api/history/cluster
 * @param {number} limit 
 * @returns {Array} List of past cluster predictions
 */
export async function getClusterHistory(limit = 5) {
  return fetchWithTimeout(`${BASE}/history/cluster?limit=${limit}`);
}

/**
 * GET /api/model-info
 * @returns {{ best_model, models: {LR: {...}, RF: {...}}, feature_importance, ... }}
 */
export async function getModelInfo() {
  return fetchWithTimeout(`${BASE}/model-info`);
}

/**
 * GET /api/analytics
 * @returns {{ n_clusters, silhouette_score, cluster_sizes, cluster_chars, scatter_sample, pca_variance }}
 */
export async function getAnalytics() {
  return fetchWithTimeout(`${BASE}/analytics`);
}

/**
 * GET /api/health — check if backend is reachable
 */
export async function checkHealth() {
  return fetchWithTimeout(`${BASE}/health`);
}
