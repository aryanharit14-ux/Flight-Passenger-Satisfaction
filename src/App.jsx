import { useState, useEffect } from 'react';
import { OverviewTab, ServicesTab, OperationsTab } from './components/Charts';
import { DataExplorer } from './components/DataExplorer';
import { InsightsTab } from './components/Insights';
import PredictPage from './pages/PredictPage';
import SegmentsPage from './pages/SegmentsPage';
import ModelPage from './pages/ModelPage';

const TABS = [
  // ── Existing 5 tabs (unchanged) ──
  { id: 'overview',    label: 'Overview',    icon: '📊', group: 'dashboard' },
  { id: 'services',   label: 'Services',    icon: '⭐', group: 'dashboard' },
  { id: 'operations', label: 'Operations',  icon: '🛫', group: 'dashboard' },
  { id: 'insights',   label: 'Insights',    icon: '💡', group: 'dashboard' },
  { id: 'data',       label: 'Data',        icon: '🗄️', group: 'dashboard' },
  // ── New ML tabs ──
  { id: 'predict',    label: 'Predict',     icon: '🤖', group: 'ml' },
  { id: 'segments',   label: 'Segments',    icon: '🔵', group: 'ml' },
  { id: 'ml-perf',    label: 'ML Perf.',    icon: '📐', group: 'ml' },
];

function LoadingScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="loading-screen">
      <div className="loading-logo">✈ SkyMetrics</div>
      <div className="loading-bar-wrap">
        <div className="loading-bar" />
      </div>
      <div className="loading-text">Loading 136K passenger records…</div>
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  if (!ready) return <LoadingScreen onDone={() => setReady(true)} />;

  const dashTabs = TABS.filter(t => t.group === 'dashboard');
  const mlTabs   = TABS.filter(t => t.group === 'ml');

  return (
    <div className="app">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-brand">
          <div className="nav-logo">✈</div>
          <div>
            <div className="nav-title">SkyMetrics</div>
            <div className="nav-subtitle">Passenger Satisfaction Dashboard</div>
          </div>
        </div>

        <div className="nav-all-tabs">
          {/* Dashboard tab group */}
          <div className="nav-tabs" role="tablist" aria-label="Dashboard tabs">
            {dashTabs.map(tab => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ML tab group */}
          <div className="nav-tabs nav-tabs-ml" role="tablist" aria-label="ML tabs">
            {mlTabs.map(tab => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="nav-meta">
          <div className="nav-dot" />
          136,374 records
        </div>
      </nav>

      {/* Main Content */}
      <main className="main" role="main">
        {/* ── Existing tabs — preserved exactly ── */}
        {activeTab === 'overview' && (
          <>
            <div className="page-header">
              <h1>Flight Passenger Satisfaction</h1>
              <p>
                Comprehensive analysis of 136,374 airline passengers across satisfaction levels,
                demographics, service ratings, and operational metrics.
              </p>
            </div>
            <OverviewTab />
          </>
        )}

        {activeTab === 'services' && (
          <>
            <div className="page-header">
              <h1>Service Quality Analysis</h1>
              <p>
                Deep dive into all 14 service dimensions rated by passengers — from in-flight WiFi
                to baggage handling, seat comfort, and beyond.
              </p>
            </div>
            <ServicesTab />
          </>
        )}

        {activeTab === 'operations' && (
          <>
            <div className="page-header">
              <h1>Operational Metrics</h1>
              <p>
                Flight delay analysis, distance distribution, and operational performance
                across 136K+ passenger records.
              </p>
            </div>
            <OperationsTab />
          </>
        )}

        {activeTab === 'insights' && <InsightsTab />}

        {activeTab === 'data' && <DataExplorer />}

        {/* ── New ML tabs ── */}
        {activeTab === 'predict'  && <PredictPage />}
        {activeTab === 'segments' && <SegmentsPage />}
        {activeTab === 'ml-perf'  && <ModelPage />}
      </main>

      {/* Footer */}
      <footer className="footer">
        <span>SkyMetrics · Dataset: Airline Passenger Satisfaction · 136,374 records</span>
        <span>React + Flask + scikit-learn · 2026</span>
      </footer>
    </div>
  );
}
