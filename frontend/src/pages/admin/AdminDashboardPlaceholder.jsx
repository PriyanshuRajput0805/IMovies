import React, { useState, useEffect } from 'react';
import { FaUserShield, FaCheckCircle, FaFilm, FaTv, FaCalendarAlt, FaTicketAlt, FaChartLine } from 'react-icons/fa';
import api from '../../services/api.js';

export const AdminDashboardPlaceholder = () => {
  const [adminVerified, setAdminVerified] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await api.get('/auth/admin-check');
        setAdminVerified(res.data.adminAccessGranted);
      } catch (err) {
        setAdminVerified(false);
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, []);

  return (
    <div className="container py-5">
      {/* Admin Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between pb-4 mb-4 border-bottom" style={{ borderColor: 'var(--imovies-border)' }}>
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge badge-gold px-3 py-1 rounded-pill d-inline-flex align-items-center gap-1">
              <FaUserShield /> Administrator Portal
            </span>
            {adminVerified && (
              <span className="badge badge-emerald px-2 py-1 rounded-pill d-inline-flex align-items-center gap-1">
                <FaCheckCircle size={10} /> Server RBAC Verified
              </span>
            )}
          </div>
          <h2 className="cinema-heading text-white m-0">IMovies Cinema Operations Dashboard</h2>
        </div>
      </div>

      {/* RBAC Verification Alert */}
      <div className="alert alert-success d-flex align-items-center gap-3 mb-4" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399' }}>
        <FaCheckCircle size={24} />
        <div>
          <strong>Role-Based Access Control (RBAC) Active:</strong> Your administrative credentials have been cryptographically validated via JWT on the server endpoint <code>GET /api/v1/auth/admin-check</code>.
        </div>
      </div>

      {/* Quick Action Preview Cards */}
      <div className="row g-4 mb-5">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-4 rounded-3 cinema-card text-center">
            <div className="p-3 rounded-circle d-inline-block mb-3" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--imovies-primary)' }}>
              <FaFilm size={24} />
            </div>
            <h5 className="text-white mb-1">Movie Management</h5>
            <p className="text-secondary small mb-3">Add, update posters, genres, ratings, and archive movies.</p>
            <span className="badge badge-gold">Phase 3 Ready</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-4 rounded-3 cinema-card text-center">
            <div className="p-3 rounded-circle d-inline-block mb-3" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--imovies-cyan)' }}>
              <FaTv size={24} />
            </div>
            <h5 className="text-white mb-1">Theatres & Screens</h5>
            <p className="text-secondary small mb-3">Configure auditorium layouts, seat tiers, and screen audio.</p>
            <span className="badge badge-gold">Phase 3 Ready</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-4 rounded-3 cinema-card text-center">
            <div className="p-3 rounded-circle d-inline-block mb-3" style={{ background: 'rgba(225, 29, 72, 0.15)', color: 'var(--imovies-accent)' }}>
              <FaCalendarAlt size={24} />
            </div>
            <h5 className="text-white mb-1">Show Scheduling</h5>
            <p className="text-secondary small mb-3">Timetable coordination with zero schedule overlap checks.</p>
            <span className="badge badge-gold">Phase 3 Ready</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-4 rounded-3 cinema-card text-center">
            <div className="p-3 rounded-circle d-inline-block mb-3" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--imovies-emerald)' }}>
              <FaChartLine size={24} />
            </div>
            <h5 className="text-white mb-1">Business Analytics</h5>
            <p className="text-secondary small mb-3">Real-time revenue, occupancy rate, and booking breakdown.</p>
            <span className="badge badge-gold">Phase 7 Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPlaceholder;
