import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaPlay, FaTicketAlt, FaChevronLeft, FaChevronRight, FaClock } from 'react-icons/fa';
import TrailerModal from './TrailerModal.jsx';

export const HeroCarousel = ({ movies = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTrailerMovie, setSelectedTrailerMovie] = useState(null);

  const featuredMovies = movies.filter((m) => m.status === 'now_showing').slice(0, 5);

  useEffect(() => {
    if (featuredMovies.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredMovies.length]);

  if (!featuredMovies.length) return null;

  const current = featuredMovies[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
  };

  return (
    <div className="position-relative overflow-hidden rounded-4 mb-5 shadow-lg" style={{ height: '520px', background: '#07090e' }}>
      {/* Background Backdrop Image */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          backgroundImage: `url(${current.backdrop || current.poster})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          filter: 'brightness(0.38) contrast(1.1)',
          transform: 'scale(1.02)',
          transition: 'background-image 0.8s ease-in-out'
        }}
      />

      {/* Cinematic Gradient Overlays */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          background: 'linear-gradient(to right, rgba(7, 9, 14, 0.98) 0%, rgba(7, 9, 14, 0.82) 45%, rgba(7, 9, 14, 0.25) 100%), linear-gradient(to top, rgba(7, 9, 14, 1) 0%, transparent 60%)'
        }}
      />

      {/* Hero Content Container */}
      <div className="container h-100 position-relative z-1 d-flex align-items-center px-4 px-md-5">
        <div className="row align-items-center w-100">
          <div className="col-12 col-md-8 col-lg-7">
            {/* Badges Row */}
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
              <span className="badge badge-gold d-inline-flex align-items-center gap-1 px-3 py-1">
                <FaStar /> {current.rating} IMDb
              </span>
              <span className="badge badge-red px-2 py-1">{current.certification}</span>
              <span className="text-secondary small d-flex align-items-center gap-1 ms-2">
                <FaClock size={12} /> {current.duration} mins
              </span>
              <span className="badge bg-dark text-warning border border-secondary">
                {current.formats?.join(' • ')}
              </span>
            </div>

            {/* Title */}
            <h1 className="display-4 fw-extrabold text-white mb-2 cinema-heading tracking-tight" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
              {current.title}
            </h1>

            {/* Genres */}
            <div className="d-flex flex-wrap gap-2 mb-3">
              {current.genres?.map((g) => (
                <span key={g} className="badge bg-secondary bg-opacity-25 text-light px-2 py-1" style={{ fontSize: '0.8rem' }}>
                  {g}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <p className="text-light text-opacity-75 lead fs-6 mb-4 line-clamp-3" style={{ maxWidth: '580px' }}>
              {current.description}
            </p>

            {/* Call To Action Buttons */}
            <div className="d-flex flex-wrap align-items-center gap-3">
              <Link
                to={`/movies/${current._id}`}
                className="btn btn-cinema-primary px-4 py-2 d-inline-flex align-items-center gap-2 fs-6 shadow"
              >
                <FaTicketAlt /> Book Tickets
              </Link>
              {current.trailerUrl && (
                <button
                  type="button"
                  onClick={() => setSelectedTrailerMovie(current)}
                  className="btn btn-cinema-outline px-4 py-2 d-inline-flex align-items-center gap-2 fs-6"
                >
                  <FaPlay size={12} /> Watch Trailer
                </button>
              )}
            </div>
          </div>

          {/* Right Poster Preview (Desktop only) */}
          <div className="col-lg-5 d-none d-lg-flex justify-content-end">
            <div
              className="position-relative rounded-4 overflow-hidden shadow-2xl"
              style={{
                width: '260px',
                aspectRatio: '2/3',
                border: '2px solid rgba(245, 158, 11, 0.3)',
                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.9), 0 0 30px rgba(245, 158, 11, 0.2)'
              }}
            >
              <img
                src={current.poster}
                alt={current.title}
                className="w-100 h-100 object-fit-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Slide Navigation Controls */}
      {featuredMovies.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="position-absolute top-50 start-0 translate-middle-y btn btn-dark btn-sm rounded-circle m-3 p-2 border-0 bg-black bg-opacity-50 text-white z-2"
            style={{ backdropFilter: 'blur(4px)' }}
            aria-label="Previous movie"
          >
            <FaChevronLeft size={16} />
          </button>
          <button
            onClick={handleNext}
            className="position-absolute top-50 end-0 translate-middle-y btn btn-dark btn-sm rounded-circle m-3 p-2 border-0 bg-black bg-opacity-50 text-white z-2"
            style={{ backdropFilter: 'blur(4px)' }}
            aria-label="Next movie"
          >
            <FaChevronRight size={16} />
          </button>

          {/* Indicator dots */}
          <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3 d-flex gap-2 z-2">
            {featuredMovies.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className="p-0 border-0 rounded-pill transition"
                style={{
                  width: currentIndex === idx ? '24px' : '8px',
                  height: '8px',
                  backgroundColor: currentIndex === idx ? 'var(--imovies-primary)' : 'rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                aria-label={`Go to slide ${idx + 1}`}
              ></button>
            ))}
          </div>
        </>
      )}

      {/* Trailer Modal */}
      {selectedTrailerMovie && (
        <TrailerModal
          movie={selectedTrailerMovie}
          onClose={() => setSelectedTrailerMovie(null)}
        />
      )}
    </div>
  );
};

export default HeroCarousel;
