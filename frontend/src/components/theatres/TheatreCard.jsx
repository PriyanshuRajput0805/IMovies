import React from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaTv, FaCalendarCheck } from 'react-icons/fa';

export const TheatreCard = ({ theatre }) => {
  if (!theatre) return null;

  return (
    <div className="cinema-card p-4 h-100 d-flex flex-column justify-content-between">
      <div>
        <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
          <span className="badge badge-gold">{theatre.city}</span>
          <span className="badge bg-secondary small d-flex align-items-center gap-1">
            <FaTv size={10} /> {theatre.screensCount || 2} Screens
          </span>
        </div>

        <h5 className="cinema-heading text-white mb-2">{theatre.name}</h5>

        <p className="text-secondary small mb-3 d-flex align-items-start gap-1">
          <FaMapMarkerAlt size={13} className="mt-1 flex-shrink-0" style={{ color: 'var(--imovies-primary)' }} />
          <span>{theatre.address}, {theatre.state}</span>
        </p>

        {/* Amenities tags */}
        <div className="d-flex flex-wrap gap-1 mb-4">
          {theatre.amenities?.slice(0, 4).map((a) => (
            <span
              key={a}
              className="badge bg-dark text-secondary border border-secondary"
              style={{ fontSize: '0.65rem' }}
            >
              {a}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-3 border-top" style={{ borderColor: 'var(--imovies-border)' }}>
        <Link
          to={`/theatres/${theatre._id}`}
          className="btn btn-cinema-outline btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
        >
          <FaCalendarCheck size={12} /> View Showtimes
        </Link>
      </div>
    </div>
  );
};

export default TheatreCard;
