import React from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaClock, FaTicketAlt } from 'react-icons/fa';

export const MovieCard = ({ movie }) => {
  if (!movie) return null;

  return (
    <div className="h-100 d-flex flex-column">
      <div className="cinema-card h-100 d-flex flex-column overflow-hidden position-relative group-hover">
        {/* Poster Wrapper with Aspect Ratio */}
        <div className="position-relative overflow-hidden" style={{ aspectRatio: '2/3', background: '#0a0d14' }}>
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-100 h-100 object-fit-cover"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500';
            }}
          />

          {/* Top Badges */}
          <div className="position-absolute top-0 start-0 w-100 p-2 d-flex justify-content-between align-items-center">
            {movie.rating ? (
              <span className="badge badge-gold d-inline-flex align-items-center gap-1 shadow">
                <FaStar size={11} /> {movie.rating}
              </span>
            ) : <span></span>}

            <span className="badge badge-red shadow" style={{ fontSize: '0.7rem' }}>
              {movie.certification || 'UA'}
            </span>
          </div>

          {/* Format Tags (e.g. IMAX 3D, 2D) */}
          <div className="position-absolute bottom-0 start-0 w-100 p-2 d-flex flex-wrap gap-1" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)' }}>
            {movie.formats?.slice(0, 2).map((fmt) => (
              <span key={fmt} className="badge bg-dark text-warning border border-secondary" style={{ fontSize: '0.65rem' }}>
                {fmt}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-3 d-flex flex-column flex-grow-1 justify-content-between">
          <div>
            <Link to={`/movies/${movie._id}`} className="text-decoration-none">
              <h6 className="cinema-heading text-white text-truncate mb-1 hover-warning" title={movie.title}>
                {movie.title}
              </h6>
            </Link>

            <div className="d-flex align-items-center gap-2 text-secondary small mb-2">
              <span className="d-flex align-items-center gap-1">
                <FaClock size={11} /> {movie.duration}m
              </span>
              <span>&bull;</span>
              <span className="text-truncate" style={{ maxWidth: '140px' }}>
                {movie.genres?.slice(0, 2).join(', ')}
              </span>
            </div>
          </div>

          <div className="pt-2 border-top" style={{ borderColor: 'var(--imovies-border)' }}>
            <Link
              to={`/movies/${movie._id}`}
              className="btn btn-cinema-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
            >
              <FaTicketAlt size={12} />
              <span>{movie.status === 'upcoming' ? 'View Details' : 'Book Tickets'}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
