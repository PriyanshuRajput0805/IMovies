import React, { useState, useEffect } from 'react';
import { FaSearch, FaMapMarkerAlt, FaTv } from 'react-icons/fa';
import api from '../../services/api.js';
import TheatreCard from '../../components/theatres/TheatreCard.jsx';

export const TheatresPage = () => {
  const [theatres, setTheatres] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await api.get('/theatres/cities');
        setCities(res.data);
      } catch (err) {
        console.warn('Failed to load cities:', err);
      }
    };
    fetchCities();
  }, []);

  const fetchTheatres = async () => {
    setLoading(true);
    try {
      let url = `/theatres?city=${selectedCity}`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      const res = await api.get(url);
      setTheatres(res.data);
    } catch (err) {
      console.warn('Failed to fetch theatres:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheatres();
  }, [selectedCity, search]);

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between pb-3 mb-4 border-bottom" style={{ borderColor: 'var(--imovies-border)' }}>
        <div>
          <span className="badge badge-gold px-3 py-1 mb-2 rounded-pill">Cinema Locations</span>
          <h2 className="cinema-heading text-white m-0">Theatres & Multiplexes</h2>
        </div>

        {/* Search */}
        <div className="mt-3 mt-md-0" style={{ maxWidth: '340px', width: '100%' }}>
          <div className="input-group">
            <span className="input-group-text bg-transparent border-end-0" style={{ borderColor: 'var(--imovies-border)', color: 'var(--imovies-text-muted)' }}>
              <FaSearch size={14} />
            </span>
            <input
              type="search"
              className="form-control bg-transparent text-white border-start-0 shadow-none"
              style={{ borderColor: 'var(--imovies-border)', fontSize: '0.9rem' }}
              placeholder="Search theatre or area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* City Chips Filter */}
      <div className="d-flex flex-wrap gap-2 mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--imovies-border)' }}>
        <button
          className={`btn btn-sm ${selectedCity === 'All' ? 'btn-cinema-primary' : 'btn-cinema-outline'} rounded-pill px-3 py-1`}
          onClick={() => setSelectedCity('All')}
        >
          All Locations
        </button>
        {cities.map((city) => (
          <button
            key={city}
            className={`btn btn-sm ${selectedCity === city ? 'btn-cinema-primary' : 'btn-cinema-outline'} rounded-pill px-3 py-1`}
            onClick={() => setSelectedCity(city)}
          >
            {city}
          </button>
        ))}
      </div>

      {/* Theatres Grid */}
      {loading ? (
        <div className="text-center py-5 text-secondary">
          <div className="spinner-border text-warning mb-3" role="status"></div>
          <p>Finding cinema theatres near you...</p>
        </div>
      ) : theatres.length === 0 ? (
        <div className="cinema-card p-5 text-center">
          <FaTv size={36} className="text-warning mb-3" />
          <h4 className="cinema-heading text-white mb-2">No Theatres Found</h4>
          <p className="text-secondary small mb-3">
            No theatres match your search in {selectedCity}. Try selecting All Locations.
          </p>
          <button onClick={() => { setSelectedCity('All'); setSearch(''); }} className="btn btn-cinema-primary">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {theatres.map((t) => (
            <div key={t._id} className="col-12 col-md-6 col-lg-4">
              <TheatreCard theatre={t} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TheatresPage;
