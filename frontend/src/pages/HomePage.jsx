import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaFilm, FaCalendarAlt, FaMapMarkerAlt, FaChevronRight, FaTv, FaLayerGroup } from 'react-icons/fa';
import api from '../services/api.js';
import HeroCarousel from '../components/movies/HeroCarousel.jsx';
import MovieCard from '../components/movies/MovieCard.jsx';
import TheatreCard from '../components/theatres/TheatreCard.jsx';
import HealthCheckBanner from '../components/common/HealthCheckBanner.jsx';

export const HomePage = ({ onStatusChange }) => {
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [showArchDetails, setShowArchDetails] = useState(false);

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      try {
        const [mRes, tRes, cRes] = await Promise.all([
          api.get('/movies?status=all&limit=20'),
          api.get('/theatres'),
          api.get('/theatres/cities')
        ]);
        setMovies(mRes.data || []);
        setTheatres(tRes.data || []);
        setCities(cRes.data || []);
      } catch (err) {
        console.warn('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const nowShowing = movies.filter((m) => m.status === 'now_showing');
  const upcoming = movies.filter((m) => m.status === 'upcoming');
  const featuredTheatres = theatres.slice(0, 3);

  const phases = [
    { number: '01', title: 'Foundation', status: 'Completed', active: true, desc: 'Project scaffolding, Mongoose connection, Socket.IO server, rate limiting, health checks, environment configs.' },
    { number: '02', title: 'Authentication', status: 'Completed', active: true, desc: 'User registration, login, JWT token auth, bcryptjs password hashing, role-based access control (user/admin).' },
    { number: '03', title: 'Cinema Data', status: 'Completed', active: true, desc: 'Movies, theatres, screens, seat layouts, show scheduling, conflict detection, and admin CRUD interfaces.' },
    { number: '04', title: 'Customer Experience', status: 'Completed', active: true, desc: 'Cinematic homepage, movie search, multi-filter discovery, movie details, trailer modals, showtime selectors.' },
    { number: '05', title: 'Seat Booking', status: 'Next Phase', active: false, desc: 'Interactive SVG/Canvas seat maps, 10-minute server seat locking, Socket.IO live broadcasts, zero double-booking.' },
    { number: '06', title: 'Payments', status: 'Upcoming', active: false, desc: 'Razorpay payment orders, server-side HMAC signature verification, webhook processing, mock-payment fallback.' },
    { number: '07', title: 'Dashboards', status: 'Upcoming', active: false, desc: 'User booking history, digital QR tickets, cancellation & refund workflows, admin operational metrics.' },
    { number: '08', title: 'Quality Assurance', status: 'Upcoming', active: false, desc: 'Comprehensive Jest/Supertest suite, concurrency collision testing, NVDA keyboard accessibility audits.' },
    { number: '09', title: 'Deployment', status: 'Upcoming', active: false, desc: 'Production build configuration, Atlas network access, Render/Vercel continuous deployment workflows.' },
  ];

  return (
    <div className="container px-4 py-4">
      {/* 1. Cinematic Hero Carousel */}
      {nowShowing.length > 0 && <HeroCarousel movies={nowShowing} />}

      {/* 2. Quick City & Date Access Bar */}
      <div className="cinema-card p-3 mb-5 d-flex flex-column flex-md-row align-items-center justify-content-between gap-3" style={{ background: 'linear-gradient(90deg, #101626 0%, #0c101a 100%)' }}>
        <div className="d-flex align-items-center gap-3 w-100 w-md-auto">
          <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-dark border border-secondary flex-grow-1 flex-md-grow-0">
            <FaMapMarkerAlt style={{ color: 'var(--imovies-primary)' }} />
            <select
              className="form-select form-select-sm bg-transparent border-0 text-white p-0 shadow-none"
              style={{ cursor: 'pointer', minWidth: '130px' }}
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              {cities.map((city) => (
                <option key={city} value={city} className="bg-dark text-white">
                  {city}
                </option>
              ))}
            </select>
          </div>

          <span className="text-secondary small d-none d-lg-inline">
            Browse screenings & theatres in <strong>{selectedCity}</strong>
          </span>
        </div>

        <div className="d-flex align-items-center gap-2 w-100 w-md-auto justify-content-end">
          <button
            onClick={() => navigate(`/movies?status=now_showing`)}
            className="btn btn-cinema-primary btn-sm flex-fill flex-md-grow-0 px-4 py-2"
          >
            Find Now Showing
          </button>
          <button
            onClick={() => navigate(`/theatres?city=${selectedCity}`)}
            className="btn btn-cinema-outline btn-sm flex-fill flex-md-grow-0 px-3 py-2"
          >
            View Theatres
          </button>
        </div>
      </div>

      {/* 3. Now Showing Section */}
      <section className="mb-5">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h3 className="cinema-heading text-white m-0 d-flex align-items-center gap-2">
              <FaFilm style={{ color: 'var(--imovies-primary)' }} /> Now Showing in Cinemas
            </h3>
            <p className="text-secondary small m-0">Book tickets for today's hottest theatrical releases.</p>
          </div>
          <Link to="/movies?status=now_showing" className="text-warning text-decoration-none small fw-semibold d-flex align-items-center gap-1">
            <span>See All ({nowShowing.length})</span> <FaChevronRight size={10} />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5 text-secondary">
            <div className="spinner-border text-warning mb-2" role="status"></div>
            <p>Loading now showing movies...</p>
          </div>
        ) : (
          <div className="row g-4">
            {nowShowing.slice(0, 4).map((movie) => (
              <div key={movie._id} className="col-12 col-sm-6 col-lg-3">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Upcoming Movies Section */}
      {upcoming.length > 0 && (
        <section className="mb-5">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h3 className="cinema-heading text-white m-0 d-flex align-items-center gap-2">
                <FaCalendarAlt style={{ color: 'var(--imovies-accent)' }} /> Upcoming Blockbusters
              </h3>
              <p className="text-secondary small m-0">Anticipated cinematic releases coming soon to screens near you.</p>
            </div>
            <Link to="/movies?status=upcoming" className="text-warning text-decoration-none small fw-semibold d-flex align-items-center gap-1">
              <span>View All Upcoming</span> <FaChevronRight size={10} />
            </Link>
          </div>

          <div className="row g-4">
            {upcoming.slice(0, 4).map((movie) => (
              <div key={movie._id} className="col-12 col-sm-6 col-lg-3">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Featured Theatres Section */}
      <section className="mb-5">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h3 className="cinema-heading text-white m-0 d-flex align-items-center gap-2">
              <FaTv style={{ color: 'var(--imovies-cyan)' }} /> Featured Multiplexes
            </h3>
            <p className="text-secondary small m-0">World-class auditoriums featuring IMAX Laser, Dolby Atmos, and luxury recliners.</p>
          </div>
          <Link to="/theatres" className="text-warning text-decoration-none small fw-semibold d-flex align-items-center gap-1">
            <span>All Theatres ({theatres.length})</span> <FaChevronRight size={10} />
          </Link>
        </div>

        <div className="row g-4">
          {featuredTheatres.map((theatre) => (
            <div key={theatre._id} className="col-12 col-md-4">
              <TheatreCard theatre={theatre} />
            </div>
          ))}
        </div>
      </section>

      {/* 6. System Diagnostics & Roadmap Collapsible Bar */}
      <div className="pt-4 border-top" style={{ borderColor: 'var(--imovies-border)' }}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <button
            onClick={() => setShowArchDetails(!showArchDetails)}
            className="btn btn-cinema-outline btn-sm d-flex align-items-center gap-2"
          >
            <FaLayerGroup />
            <span>{showArchDetails ? 'Hide System Diagnostics & Roadmap' : 'Show System Diagnostics & Roadmap'}</span>
          </button>
          <span className="badge badge-emerald px-3 py-1 rounded-pill">
            Phases 1-4: Complete
          </span>
        </div>

        {showArchDetails && (
          <div className="mt-3">
            <HealthCheckBanner onStatusChange={onStatusChange} />

            <div className="row g-3 mt-2">
              {phases.map((phase) => (
                <div key={phase.number} className="col-12 col-md-6 col-lg-4">
                  <div
                    className={`p-3 rounded-3 h-100 ${phase.active ? 'cinema-card' : ''}`}
                    style={{
                      background: phase.active ? 'linear-gradient(180deg, #151f33 0%, #101626 100%)' : '#0c101a',
                      border: phase.active ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--imovies-border)'
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="fw-bold" style={{ color: phase.active ? 'var(--imovies-primary)' : 'var(--imovies-text-subtle)' }}>
                        Phase {phase.number}
                      </span>
                      <span className={`badge ${phase.status === 'Completed' ? 'badge-emerald' : 'badge-gold'}`} style={{ fontSize: '0.7rem' }}>
                        {phase.status}
                      </span>
                    </div>
                    <h6 className="text-white mb-1">{phase.title}</h6>
                    <p className="text-secondary small mb-0">{phase.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
