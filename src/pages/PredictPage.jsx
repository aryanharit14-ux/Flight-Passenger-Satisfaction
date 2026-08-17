import { useState, useEffect } from 'react';
import { predictSatisfaction, predictCluster, getPredictHistory } from '../services/api';

// ── Exact feature definitions matching the dataset and preprocessing.py ──────
const CAT_FIELDS = [
  {
    key: 'Gender',
    label: 'Gender',
    options: ['Female', 'Male'],
  },
  {
    key: 'Customer Type',
    label: 'Customer Type',
    options: ['First-time', 'Returning'],
  },
  {
    key: 'Type of Travel',
    label: 'Type of Travel',
    options: ['Business', 'Personal'],
  },
  {
    key: 'Class',
    label: 'Travel Class',
    options: ['Business', 'Economy', 'Economy Plus'],
  },
];

const NUM_FIELDS = [
  { key: 'Age',             label: 'Age',              min: 7,  max: 85,   step: 1,  def: 35  },
  { key: 'Flight Distance', label: 'Flight Distance (km)', min: 31, max: 4983, step: 1, def: 1000 },
  { key: 'Departure Delay', label: 'Departure Delay (min)', min: 0, max: 1592, step: 1, def: 0 },
  { key: 'Arrival Delay',   label: 'Arrival Delay (min)',   min: 0, max: 1584, step: 1, def: 0 },
];

const SERVICE_FIELDS = [
  { key: 'Departure and Arrival Time Convenience', label: 'Departure/Arrival Convenience' },
  { key: 'Ease of Online Booking',                label: 'Ease of Online Booking' },
  { key: 'Check-in Service',                      label: 'Check-in Service' },
  { key: 'Online Boarding',                       label: 'Online Boarding' },
  { key: 'Gate Location',                         label: 'Gate Location' },
  { key: 'On-board Service',                      label: 'On-board Service' },
  { key: 'Seat Comfort',                          label: 'Seat Comfort' },
  { key: 'Leg Room Service',                      label: 'Leg Room Service' },
  { key: 'Cleanliness',                           label: 'Cleanliness' },
  { key: 'Food and Drink',                        label: 'Food and Drink' },
  { key: 'In-flight Service',                     label: 'In-flight Service' },
  { key: 'In-flight Wifi Service',                label: 'In-flight Wifi Service' },
  { key: 'In-flight Entertainment',               label: 'In-flight Entertainment' },
  { key: 'Baggage Handling',                      label: 'Baggage Handling' },
];

const initialForm = () => {
  const f = {};
  CAT_FIELDS.forEach(c => (f[c.key] = c.options[0]));
  NUM_FIELDS.forEach(c => (f[c.key] = c.def));
  SERVICE_FIELDS.forEach(c => (f[c.key] = 3));
  return f;
};

// ── Sub-components ──────────────────────────────────────────────────────────

function StarRating({ value, onChange }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`star-btn ${n <= value ? 'active' : ''}`}
          onClick={() => onChange(n)}
          aria-label={`Rate ${n}`}
        >
          ★
        </button>
      ))}
      <span className="star-value">{value}/5</span>
    </div>
  );
}

function Spinner() {
  return <div className="spinner" role="status" aria-label="Loading" />;
}

function ApiError({ message }) {
  return (
    <div className="api-error" role="alert">
      <span className="api-error-icon">⚠</span>
      <div>
        <div className="api-error-title">Backend Error</div>
        <div className="api-error-msg">{message}</div>
      </div>
    </div>
  );
}

function PredictionResult({ result }) {
  const isSat = result.prediction === 'Satisfied';
  const prob = isSat ? result.probability_satisfied : result.probability_dissatisfied;

  return (
    <div className={`result-card ${isSat ? 'result-sat' : 'result-dis'}`}>
      <div className="result-badge">
        <span className="result-icon">{isSat ? '✓' : '✗'}</span>
        <span className="result-label">{result.prediction}</span>
      </div>
      <div className="result-body">
        <div className="result-row">
          <span className="result-key">Confidence</span>
          <span className="result-val">{(prob * 100).toFixed(1)}%</span>
        </div>
        <div className="conf-bar-wrap">
          <div className="conf-bar" style={{ width: `${prob * 100}%`, background: isSat ? '#2dd4bf' : '#f87171' }} />
        </div>
        <div className="result-probs">
          <span style={{ color: '#2dd4bf' }}>Satisfied: {(result.probability_satisfied * 100).toFixed(1)}%</span>
          <span style={{ color: '#f87171' }}>Dissatisfied: {(result.probability_dissatisfied * 100).toFixed(1)}%</span>
        </div>
        <div className="result-row" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid hsl(220,14%,20%)' }}>
          <span className="result-key">Model Used</span>
          <span className="result-val">{result.model_used}</span>
        </div>
        
        {result.top_contributing_features && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid hsl(220,14%,20%)' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(215,12%,50%)', marginBottom: '12px' }}>
              Top Contributing Factors (SHAP)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {result.top_contributing_features.map((feat, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'hsl(215,25%,85%)' }}>{feat.feature}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: 600,
                      color: feat.direction === 'positive' ? '#2dd4bf' : '#f87171' 
                    }}>
                      {feat.direction === 'positive' ? '+' : ''}{feat.contribution.toFixed(4)}
                    </span>
                    <div style={{ 
                      width: '40px', 
                      height: '6px', 
                      borderRadius: '3px',
                      background: 'hsl(220,14%,20%)',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        right: feat.direction === 'negative' ? 0 : 'auto',
                        left: feat.direction === 'positive' ? 0 : 'auto',
                        width: `${Math.min(100, Math.abs(feat.contribution) * 250)}%`, // heuristic scaling for the bar purely for visualization
                        background: feat.direction === 'positive' ? '#2dd4bf' : '#f87171',
                        borderRadius: '3px'
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ClusterResult({ result }) {
  const CLUSTER_COLORS = ['#3b82f6', '#2dd4bf', '#a78bfa', '#fb923c'];
  const color = CLUSTER_COLORS[result.cluster_id] || '#3b82f6';
  const CLUSTER_NAMES = ['Premium Loyalists', 'Budget Travelers', 'Business Regulars', 'Leisure Seekers'];

  return (
    <div className="result-card" style={{ borderColor: `${color}55` }}>
      <div className="result-badge" style={{ background: `${color}22` }}>
        <span style={{ color, fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700 }}>
          #{result.cluster_id}
        </span>
        <span className="result-label" style={{ color }}>
          Cluster {result.cluster_id} — {CLUSTER_NAMES[result.cluster_id] || 'Segment'}
        </span>
      </div>
      <div className="result-body">
        <div className="result-row">
          <span className="result-key">Cluster Size</span>
          <span className="result-val">{result.cluster_size?.toLocaleString()} passengers</span>
        </div>
        <div className="result-row">
          <span className="result-key">PCA Position</span>
          <span className="result-val">({result.pca_x?.toFixed(2)}, {result.pca_y?.toFixed(2)})</span>
        </div>
        {result.characteristics && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'hsl(215,12%,42%)', marginBottom: '8px' }}>
              Cluster Profile (medians)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {['Age', 'Flight Distance', 'Seat Comfort', 'In-flight Wifi Service'].map(k => (
                <div key={k} style={{ fontSize: '0.78rem', color: 'hsl(215,15%,65%)' }}>
                  <span style={{ color: 'hsl(215,12%,42%)' }}>{k}: </span>
                  <span style={{ fontWeight: 600, color: 'hsl(215,25%,92%)' }}>{result.characteristics[k]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function PredictPage() {
  const [form, setForm] = useState(initialForm());
  const [predLoading, setPredLoading] = useState(false);
  const [predResult, setPredResult] = useState(null);
  const [predError, setPredError] = useState(null);
  const [clusterLoading, setClusterLoading] = useState(false);
  const [clusterResult, setClusterResult] = useState(null);
  const [clusterError, setClusterError] = useState(null);
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    try {
      const hist = await getPredictHistory(5);
      setHistory(hist);
    } catch (e) {
      console.error("Failed to load history", e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handlePredict = async e => {
    e.preventDefault();
    setPredLoading(true);
    setPredResult(null);
    setPredError(null);
    try {
      const res = await predictSatisfaction(form);
      setPredResult(res);
      loadHistory(); // Refresh history
    } catch (err) {
      setPredError(err.message);
    } finally {
      setPredLoading(false);
    }
  };

  const handleCluster = async () => {
    setClusterLoading(true);
    setClusterResult(null);
    setClusterError(null);
    try {
      const res = await predictCluster(form);
      setClusterResult(res);
    } catch (err) {
      setClusterError(err.message);
    } finally {
      setClusterLoading(false);
    }
  };

  return (
    <div className="predict-page">
      <div className="page-header">
        <h1>Passenger Satisfaction Predictor</h1>
        <p>
          Fill in the passenger details below. The trained {' '}
          <strong>Machine Learning model</strong> will predict satisfaction and segment the passenger in real-time.
        </p>
      </div>

      <div className="predict-layout">
        {/* ── Form ── */}
        <form className="predict-form" onSubmit={handlePredict} id="predict-form">

          {/* Categorical */}
          <div className="form-section">
            <div className="form-section-title">Passenger Demographics</div>
            <div className="form-grid-2">
              {CAT_FIELDS.map(f => (
                <div className="form-field" key={f.key}>
                  <label className="form-label" htmlFor={`field-${f.key}`}>{f.label}</label>
                  <select
                    id={`field-${f.key}`}
                    className="form-select"
                    value={form[f.key]}
                    onChange={e => update(f.key, e.target.value)}
                  >
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Numeric */}
          <div className="form-section">
            <div className="form-section-title">Flight Details</div>
            <div className="form-grid-2">
              {NUM_FIELDS.map(f => (
                <div className="form-field" key={f.key}>
                  <label className="form-label" htmlFor={`field-${f.key}`}>
                    {f.label}
                    <span className="form-range-hint">{f.min}–{f.max}</span>
                  </label>
                  <input
                    id={`field-${f.key}`}
                    type="number"
                    className="form-input"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={form[f.key]}
                    onChange={e => update(f.key, parseFloat(e.target.value) || 0)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Service ratings */}
          <div className="form-section">
            <div className="form-section-title">Service Ratings (1–5)</div>
            <div className="form-grid-2">
              {SERVICE_FIELDS.map(f => (
                <div className="form-field" key={f.key}>
                  <label className="form-label">{f.label}</label>
                  <StarRating
                    value={form[f.key]}
                    onChange={v => update(f.key, v)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={predLoading} id="btn-predict">
              {predLoading ? <><Spinner /> Predicting…</> : '🤖 Predict Satisfaction'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={clusterLoading}
              onClick={handleCluster}
              id="btn-cluster"
            >
              {clusterLoading ? <><Spinner /> Segmenting…</> : '🔍 Find Segment'}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setForm(initialForm());
                setPredResult(null);
                setPredError(null);
                setClusterResult(null);
                setClusterError(null);
              }}
            >
              Reset
            </button>
          </div>
        </form>

        {/* ── Results Panel ── */}
        <div className="results-panel">
          <div className="results-panel-title">Prediction Results</div>

          {/* Satisfaction Prediction */}
          <div className="result-section">
            <div className="result-section-label">
              <span className="result-section-dot primary" />
              Satisfaction Prediction
            </div>
            {predLoading && <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}><Spinner /></div>}
            {predError && <ApiError message={predError} />}
            {predResult && !predLoading && <PredictionResult result={predResult} />}
            {!predResult && !predLoading && !predError && (
              <div className="result-placeholder">
                Submit the form to see the ML prediction
              </div>
            )}
          </div>

          {/* Cluster Prediction */}
          <div className="result-section">
            <div className="result-section-label">
              <span className="result-section-dot accent" />
              Passenger Segment
            </div>
            {clusterLoading && <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}><Spinner /></div>}
            {clusterError && <ApiError message={clusterError} />}
            {clusterResult && !clusterLoading && <ClusterResult result={clusterResult} />}
            {!clusterResult && !clusterLoading && !clusterError && (
              <div className="result-placeholder">
                Click "Find Segment" to identify the passenger cluster
              </div>
            )}
          </div>

          {/* ── History Section ── */}
          {history.length > 0 && (
            <div className="result-section" style={{ marginTop: '24px' }}>
              <div className="result-section-label">
                <span className="result-section-dot" style={{ background: '#a78bfa' }} />
                Recent Predictions
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {history.map(item => (
                  <div key={item.id} className="result-card" style={{ padding: '12px', cursor: 'pointer' }} onClick={() => setForm({...initialForm(), ...item.passenger_input})}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'hsl(215,15%,65%)' }}>
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                      <span className="result-badge" style={{ padding: '2px 6px', fontSize: '0.75rem', margin: 0, 
                        color: item.prediction_label === 1 ? '#2dd4bf' : '#f87171',
                        background: item.prediction_label === 1 ? '#2dd4bf22' : '#f8717122'
                      }}>
                        {item.prediction}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'hsl(215,12%,50%)', marginTop: '6px' }}>
                      {item.passenger_input.Class} • {item.passenger_input['Type of Travel']} • {item.passenger_input.Age} yrs
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
