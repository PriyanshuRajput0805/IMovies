import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaLayerGroup, FaShieldAlt, FaTicketAlt, FaTv, FaBolt, FaCodeBranch } from 'react-icons/fa';
import HealthCheckBanner from '../components/common/HealthCheckBanner.jsx';

export const HomePage = ({ onStatusChange }) => {
  const phases = [
    { number: '01', title: 'Foundation', status: 'Completed', active: true, desc: 'Project scaffolding, Mongoose connection, Socket.IO server, rate limiting, health checks, environment configs.' },
    { number: '02', title: 'Authentication', status: 'Completed', active: true, desc: 'User registration, login, JWT token auth, bcryptjs password hashing, role-based access control (user/admin).' },
    { number: '03', title: 'Cinema Data', status: 'Completed', active: true, desc: 'Movies, theatres, screens, seat layouts, show scheduling, conflict detection, and admin CRUD interfaces.' },
    { number: '04', title: 'Customer Experience', status: 'Next Phase', active: false, desc: 'Cinematic homepage, movie search, multi-filter discovery, movie details, trailer modals, showtime selectors.' },
    { number: '05', title: 'Seat Booking', status: 'Upcoming', active: false, desc: 'Interactive SVG/Canvas seat maps, 10-minute server seat locking, Socket.IO live broadcasts, zero double-booking.' },
    { number: '06', title: 'Payments', status: 'Upcoming', active: false, desc: 'Razorpay payment orders, server-side HMAC signature verification, webhook processing, mock-payment fallback.' },
    { number: '07', title: 'Dashboards', status: 'Upcoming', active: false, desc: 'User booking history, digital QR tickets, cancellation & refund workflows, admin operational metrics.' },
    { number: '08', title: 'Quality Assurance', status: 'Upcoming', active: false, desc: 'Comprehensive Jest/Supertest suite, concurrency collision testing, NVDA keyboard accessibility audits.' },
    { number: '09', title: 'Deployment', status: 'Upcoming', active: false, desc: 'Production build configuration, Atlas network access, Render/Vercel continuous deployment workflows.' },
  ];

  return (
    <div className="container px-4 py-4">
      {/* Hero Section */}
      <div className="p-4 p-md-5 mb-4 rounded-4 position-relative overflow-hidden cinema-card" style={{ background: 'radial-gradient(ellipse at top right, rgba(245, 158, 11, 0.15), transparent 70%), linear-gradient(180deg, #101626 0%, #090c14 100%)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
        <div className="row align-items-center">
          <div className="col-lg-8">
            <span className="badge badge-gold px-3 py-2 mb-3 rounded-pill text-uppercase d-inline-flex align-items-center gap-2">
              <FaBolt /> Enterprise MERN Cinema Platform
            </span>
            <h1 className="display-4 fw-extrabold text-white mb-3">
              Full-Stack Cinema Management & Ticket Booking System
            </h1>
            <p className="lead text-secondary mb-4" style={{ maxWidth: '680px' }}>
              Welcome to <strong>IMovies</strong>. Engineered with real-time Socket.IO seat synchronization, server-side concurrency locks, cryptographic payment verification, and automated administrative operations.
            </p>
            <div className="d-flex flex-wrap gap-3">
              <Link to="/movies" className="btn btn-cinema-primary px-4 py-2">
                Explore Movies
              </Link>
              <a href="#architecture" className="btn btn-cinema-outline px-4 py-2">
                View System Architecture
              </a>
            </div>
          </div>
          <div className="col-lg-4 d-none d-lg-block text-center">
            <div className="p-4 rounded-3 d-inline-block" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--imovies-border)' }}>
              <div className="d-flex justify-content-center mb-3">
                <div className="p-3 rounded-circle" style={{ background: 'linear-gradient(135deg, #f59e0b, #e11d48)', color: '#07090e' }}>
                  <FaTv size={42} />
                </div>
              </div>
              <h5 className="text-white mb-1">IMovies Engine</h5>
              <p className="text-secondary small m-0">Express 4.21 &bull; React 19 &bull; Vite 6 &bull; MongoDB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Health Diagnostics Banner */}
      <HealthCheckBanner onStatusChange={onStatusChange} />

      {/* Implementation Roadmap */}
      <div id="architecture" className="mb-5 pt-3">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h3 className="cinema-heading text-white m-0 d-flex align-items-center gap-2">
              <FaLayerGroup style={{ color: 'var(--imovies-primary)' }} />
              System Implementation Roadmap
            </h3>
            <p className="text-secondary small m-0">Modular 9-phase production-ready engineering lifecycle.</p>
          </div>
          <span className="badge badge-emerald px-3 py-2 rounded-pill">
            Phases 1-3: Complete
          </span>
        </div>

        <div className="row g-3">
          {phases.map((phase) => (
            <div key={phase.number} className="col-12 col-md-6 col-lg-4">
              <div 
                className={`p-4 rounded-3 h-100 ${phase.active ? 'cinema-card' : ''}`}
                style={{
                  background: phase.active ? 'linear-gradient(180deg, #151f33 0%, #101626 100%)' : '#0c101a',
                  border: phase.active ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--imovies-border)',
                  boxShadow: phase.active ? 'var(--imovies-shadow-glow)' : 'none'
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="fs-5 fw-bold" style={{ color: phase.active ? 'var(--imovies-primary)' : 'var(--imovies-text-subtle)' }}>
                    {phase.number}
                  </span>
                  <span className={`badge ${phase.active ? 'badge-emerald' : 'badge-gold'}`} style={{ fontSize: '0.75rem' }}>
                    {phase.status}
                  </span>
                </div>
                <h5 className="text-white mb-2">{phase.title}</h5>
                <p className="text-secondary small mb-0">{phase.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Architectural Principles Grid */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <div className="p-4 rounded-3 cinema-card h-100">
            <div className="p-3 rounded-circle d-inline-block mb-3" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--imovies-primary)' }}>
              <FaBolt size={22} />
            </div>
            <h5 className="text-white mb-2">Zero Double-Booking Guarantee</h5>
            <p className="text-secondary small mb-0">
              Distributed seat reservations with server-side lease expirations (TTL) and atomic MongoDB transaction check-and-lock operations.
            </p>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="p-4 rounded-3 cinema-card h-100">
            <div className="p-3 rounded-circle d-inline-block mb-3" style={{ background: 'rgba(225, 29, 72, 0.1)', color: 'var(--imovies-accent)' }}>
              <FaShieldAlt size={22} />
            </div>
            <h5 className="text-white mb-2">Defense-in-Depth Security</h5>
            <p className="text-secondary small mb-0">
              Helmet HTTP headers, IP rate-limiting on sensitive endpoints, JWT session signing, bcrypt hashing, and strict role authorization.
            </p>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="p-4 rounded-3 cinema-card h-100">
            <div className="p-3 rounded-circle d-inline-block mb-3" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--imovies-cyan)' }}>
              <FaCodeBranch size={22} />
            </div>
            <h5 className="text-white mb-2">Dual Socket.IO & REST Sync</h5>
            <p className="text-secondary small mb-0">
              Rooms scoped per show (`show:id`) and user (`user:id`) ensuring optimal payload efficiency without leaking private customer data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
