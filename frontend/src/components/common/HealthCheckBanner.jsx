import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaSync, FaServer, FaDatabase, FaWifi } from 'react-icons/fa';
import api from '../../services/api.js';

export const HealthCheckBanner = ({ onStatusChange }) => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [latency, setLatency] = useState(null);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await api.get('/health');
      const duration = Math.round(performance.now() - start);
      setLatency(duration);
      setHealth(res.data);
      setError(null);
      if (onStatusChange) onStatusChange(true);
    } catch (err) {
      setError(err.message || 'Cannot reach API server');
      setHealth(null);
      if (onStatusChange) onStatusChange(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card cinema-card mb-4 border-0" style={{ background: 'linear-gradient(180deg, #131b2e 0%, #0c121e 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="card-body p-4">
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              {health?.status === 'healthy' ? (
                <FaCheckCircle className="text-success" size={20} />
              ) : (
                <FaExclamationTriangle className="text-warning" size={20} />
              )}
              <h5 className="cinema-heading text-white m-0">Phase 1 Foundation: System Status & Health Diagnostics</h5>
            </div>
            <p className="text-secondary small m-0">
              Live automated health checks monitor backend REST API, MongoDB connection, memory metrics, and real-time Socket.IO.
            </p>
          </div>

          <button
            onClick={fetchHealth}
            disabled={loading}
            className="btn btn-cinema-outline btn-sm d-flex align-items-center gap-2"
          >
            <FaSync className={loading ? 'fa-spin' : ''} size={12} />
            <span>{loading ? 'Checking...' : 'Refresh Status'}</span>
          </button>
        </div>

        {error ? (
          <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-0">
            <FaExclamationTriangle />
            <span>Connection degraded: {error}. Ensure backend is running on <code>http://localhost:5000</code>.</span>
          </div>
        ) : health ? (
          <div className="row g-3">
            <div className="col-12 col-sm-6 col-md-3">
              <div className="p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--imovies-border)' }}>
                <div className="d-flex align-items-center gap-2 text-secondary small mb-1">
                  <FaServer />
                  <span>REST API Status</span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="fw-bold text-success">{health.status.toUpperCase()}</span>
                  <span className="badge badge-gold">{latency}ms</span>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-3">
              <div className="p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--imovies-border)' }}>
                <div className="d-flex align-items-center gap-2 text-secondary small mb-1">
                  <FaDatabase />
                  <span>Database</span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="fw-bold text-white text-capitalize">{health.database?.status}</span>
                  <span className="badge badge-emerald small" style={{ fontSize: '0.65rem' }}>
                    {health.database?.mode?.includes('Atlas') ? 'Atlas' : 'In-Memory'}
                  </span>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-3">
              <div className="p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--imovies-border)' }}>
                <div className="d-flex align-items-center gap-2 text-secondary small mb-1">
                  <FaWifi />
                  <span>Server Uptime</span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="fw-bold text-white">{health.uptimeSeconds}s</span>
                  <span className="text-secondary small">{health.environment}</span>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-3">
              <div className="p-3 rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--imovies-border)' }}>
                <div className="d-flex align-items-center gap-2 text-secondary small mb-1">
                  <FaServer />
                  <span>Heap Memory</span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="fw-bold text-white">{health.memory?.heapUsedMB} MB</span>
                  <span className="text-secondary small">/ {health.memory?.heapTotalMB} MB</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default HealthCheckBanner;
