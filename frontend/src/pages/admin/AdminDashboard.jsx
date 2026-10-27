import React, { useState, useEffect } from 'react';
import { FaFilm, FaTv, FaCalendarAlt, FaUserShield, FaCheckCircle, FaLayerGroup } from 'react-icons/fa';
import api from '../../services/api.js';
import AdminMoviesTab from './AdminMoviesTab.jsx';
import AdminTheatresTab from './AdminTheatresTab.jsx';
import AdminShowsTab from './AdminShowsTab.jsx';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('movies');
  const [stats, setStats] = useState({
    moviesCount: 0,
    theatresCount: 0,
    showsCount: 0
  });

  const loadStats = async () => {
    try {
      const [mRes, tRes, sRes] = await Promise.all([
        api.get('/movies?status=all&limit=1'),
        api.get('/theatres'),
        api.get('/shows')
      ]);
      setStats({
        moviesCount: mRes.meta?.total || mRes.data?.length || 0,
        theatresCount: tRes.data?.length || 0,
        showsCount: sRes.data?.length || 0
      });
    } catch (err) {
      console.warn('Failed to load admin stats:', err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between pb-3 mb-4 border-bottom" style={{ borderColor: 'var(--imovies-border)' }}>
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge badge-gold px-3 py-1 rounded-pill d-inline-flex align-items-center gap-1">
              <FaUserShield /> Administrator Portal
            </span>
            <span className="badge badge-emerald px-2 py-1 rounded-pill d-inline-flex align-items-center gap-1">
              <FaCheckCircle size={10} /> Live MongoDB Atlas Sync
            </span>
          </div>
          <h2 className="cinema-heading text-white m-0">Cinema Operations & Data Management</h2>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-4">
          <div className="p-3 rounded-3 cinema-card d-flex align-items-center justify-content-between">
            <div>
              <span className="text-secondary small d-block mb-1">Movies in Catalogue</span>
              <h3 className="text-white fw-bold m-0">{stats.moviesCount}</h3>
            </div>
            <div className="p-3 rounded-circle" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--imovies-primary)' }}>
              <FaFilm size={24} />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-4">
          <div className="p-3 rounded-3 cinema-card d-flex align-items-center justify-content-between">
            <div>
              <span className="text-secondary small d-block mb-1">Cinema Theatres</span>
              <h3 className="text-white fw-bold m-0">{stats.theatresCount}</h3>
            </div>
            <div className="p-3 rounded-circle" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--imovies-cyan)' }}>
              <FaTv size={24} />
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-4">
          <div className="p-3 rounded-3 cinema-card d-flex align-items-center justify-content-between">
            <div>
              <span className="text-secondary small d-block mb-1">Scheduled Screenings</span>
              <h3 className="text-white fw-bold m-0">{stats.showsCount}</h3>
            </div>
            <div className="p-3 rounded-circle" style={{ background: 'rgba(225, 29, 72, 0.1)', color: 'var(--imovies-accent)' }}>
              <FaCalendarAlt size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="d-flex gap-2 p-1 rounded-3 mb-4" style={{ background: '#080c14', border: '1px solid var(--imovies-border)', width: 'fit-content' }}>
        <button
          className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 ${activeTab === 'movies' ? 'btn-cinema-primary' : 'btn-cinema-outline border-0'}`}
          onClick={() => setActiveTab('movies')}
        >
          <FaFilm /> Movie Management
        </button>
        <button
          className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 ${activeTab === 'theatres' ? 'btn-cinema-primary' : 'btn-cinema-outline border-0'}`}
          onClick={() => setActiveTab('theatres')}
        >
          <FaTv /> Theatres & Screens
        </button>
        <button
          className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 ${activeTab === 'shows' ? 'btn-cinema-primary' : 'btn-cinema-outline border-0'}`}
          onClick={() => setActiveTab('shows')}
        >
          <FaCalendarAlt /> Show Scheduling & Conflicts
        </button>
      </div>

      {/* Active Tab Component */}
      <div>
        {activeTab === 'movies' && <AdminMoviesTab />}
        {activeTab === 'theatres' && <AdminTheatresTab />}
        {activeTab === 'shows' && <AdminShowsTab />}
      </div>
    </div>
  );
};

export default AdminDashboard;
