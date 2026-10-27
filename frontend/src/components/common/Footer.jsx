import React from 'react';
import { FaFilm, FaShieldAlt, FaTicketAlt, FaClock } from 'react-icons/fa';

export const Footer = () => {
  return (
    <footer className="mt-auto pt-5 pb-4" style={{ background: '#05070a', borderTop: '1px solid var(--imovies-border)' }}>
      <div className="container px-4">
        {/* Value Props Row */}
        <div className="row g-4 pb-5 border-bottom" style={{ borderColor: 'var(--imovies-border)' }}>
          <div className="col-12 col-md-4">
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 rounded-circle" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--imovies-primary)' }}>
                <FaClock size={24} />
              </div>
              <div>
                <h6 className="text-white mb-1 fw-semibold">Real-Time Seat Locking</h6>
                <p className="text-secondary small mb-0">10-minute zero-conflict server reservations guarantee your chosen seats.</p>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 rounded-circle" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--imovies-emerald)' }}>
                <FaShieldAlt size={24} />
              </div>
              <div>
                <h6 className="text-white mb-1 fw-semibold">Secure Verified Payments</h6>
                <p className="text-secondary small mb-0">Server-side HMAC signature verification with end-to-end encryption.</p>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 rounded-circle" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--imovies-cyan)' }}>
                <FaTicketAlt size={24} />
              </div>
              <div>
                <h6 className="text-white mb-1 fw-semibold">Instant Digital Tickets</h6>
                <p className="text-secondary small mb-0">Direct QR code entry, automated PDF downloads, and booking management.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Links and Copyright */}
        <div className="d-flex flex-column flex-md-row align-items-center justify-content-between pt-4 text-secondary small">
          <div className="d-flex align-items-center gap-2 mb-3 mb-md-0">
            <div className="d-flex align-items-center justify-content-center text-dark" style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'var(--imovies-primary)' }}>
              <FaFilm size={12} />
            </div>
            <span className="text-white fw-bold">IMovies Cinema Platform</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="d-flex align-items-center gap-4">
            <span className="text-muted">Built with MERN Stack & Socket.IO</span>
            <span className="badge badge-gold px-2 py-1">v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
