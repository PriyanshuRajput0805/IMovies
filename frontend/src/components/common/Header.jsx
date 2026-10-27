import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaFilm, FaMapMarkerAlt, FaSearch, FaUserCircle, FaBars, FaTimes } from 'react-icons/fa';
import { logout } from '../../features/auth/authSlice.js';

const CITIES = ['Mumbai', 'Delhi-NCR', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune'];

export const Header = ({ backendConnected, socketConnected }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <header className="sticky-top" style={{ background: 'rgba(7, 9, 14, 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--imovies-border)', zIndex: 1030 }}>
      <div className="container-fluid px-lg-5 py-2">
        <div className="d-flex align-items-center justify-content-between">
          
          {/* Brand Logo */}
          <div className="d-flex align-items-center gap-4">
            <Link to="/" className="text-decoration-none d-flex align-items-center gap-2" aria-label="IMovies Home">
              <div className="d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#07090e' }}>
                <FaFilm size={20} />
              </div>
              <span className="cinema-heading fs-3 fw-bold tracking-tight text-white m-0">
                I<span style={{ color: 'var(--imovies-primary)' }}>Movies</span>
              </span>
            </Link>

            {/* City Selector */}
            <div className="d-none d-md-flex align-items-center gap-2 px-3 py-1 rounded" style={{ background: 'var(--imovies-bg-surface)', border: '1px solid var(--imovies-border)' }}>
              <FaMapMarkerAlt style={{ color: 'var(--imovies-primary)' }} size={13} />
              <select
                className="form-select form-select-sm bg-transparent border-0 text-white p-0 pe-4 shadow-none"
                style={{ cursor: 'pointer', fontSize: '0.875rem' }}
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                aria-label="Select City"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city} className="bg-dark text-white">
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="d-none d-lg-flex align-items-center mx-4 flex-grow-1" style={{ maxWidth: '420px' }}>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0" style={{ borderColor: 'var(--imovies-border)', color: 'var(--imovies-text-muted)' }}>
                <FaSearch size={14} />
              </span>
              <input
                type="search"
                className="form-control bg-transparent text-white border-start-0 shadow-none"
                style={{ borderColor: 'var(--imovies-border)', fontSize: '0.9rem' }}
                placeholder="Search for Movies, Theatres, or Genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search Movies"
              />
            </div>
          </form>

          {/* Right side controls: Health pill & Auth */}
          <div className="d-flex align-items-center gap-3">
            {/* Real-time status pill */}
            <div 
              className="d-none d-sm-flex align-items-center gap-2 px-2 py-1 rounded-pill"
              style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--imovies-border)', fontSize: '0.75rem' }}
              title={`API: ${backendConnected ? 'Connected' : 'Connecting...'} | Socket: ${socketConnected ? 'Live' : 'Standby'}`}
            >
              <span className={`status-pill-pulse ${backendConnected ? 'status-pill-online' : 'status-pill-offline'}`}></span>
              <span className="text-secondary">{backendConnected ? 'API Live' : 'API Connecting'}</span>
            </div>

            {/* Navigation links */}
            <nav className="d-none d-md-flex align-items-center gap-3">
              <Link to="/movies" className="text-decoration-none text-light opacity-75 hover-opacity-100 fs-6 fw-medium">
                Movies
              </Link>
              <Link to="/theatres" className="text-decoration-none text-light opacity-75 hover-opacity-100 fs-6 fw-medium">
                Theatres
              </Link>
            </nav>

            {/* Auth Buttons / Profile */}
            {isAuthenticated ? (
              <div className="dropdown">
                <button
                  className="btn btn-cinema-outline py-1 px-3 dropdown-toggle d-flex align-items-center gap-2"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <FaUserCircle size={18} style={{ color: 'var(--imovies-primary)' }} />
                  <span>{user?.name?.split(' ')[0] || 'My Account'}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow" style={{ background: 'var(--imovies-bg-card)', border: '1px solid var(--imovies-border)' }}>
                  <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                  <li><Link className="dropdown-item" to="/bookings">My Bookings</Link></li>
                  {user?.role === 'admin' && (
                    <li><Link className="dropdown-item text-warning" to="/admin">Admin Dashboard</Link></li>
                  )}
                  <li><hr className="dropdown-divider border-secondary" /></li>
                  <li><button className="dropdown-item text-danger" onClick={handleLogout}>Logout</button></li>
                </ul>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Link to="/login" className="btn btn-cinema-outline py-1 px-3 fs-6">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-cinema-primary py-1 px-3 fs-6 d-none d-sm-inline-flex">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile hamburger button */}
            <button
              className="btn btn-link text-white d-md-none p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown drawer */}
        {mobileMenuOpen && (
          <div className="d-md-none pt-3 pb-2 border-top mt-2" style={{ borderColor: 'var(--imovies-border)' }}>
            <div className="d-flex flex-column gap-2">
              <Link to="/movies" className="text-decoration-none text-white py-1" onClick={() => setMobileMenuOpen(false)}>
                Movies
              </Link>
              <Link to="/theatres" className="text-decoration-none text-white py-1" onClick={() => setMobileMenuOpen(false)}>
                Theatres
              </Link>
              {!isAuthenticated && (
                <div className="d-flex gap-2 pt-2">
                  <Link to="/login" className="btn btn-cinema-outline flex-fill text-center" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link to="/register" className="btn btn-cinema-primary flex-fill text-center" onClick={() => setMobileMenuOpen(false)}>
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
