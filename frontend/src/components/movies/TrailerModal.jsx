import React from 'react';
import { FaTimes } from 'react-icons/fa';

export const TrailerModal = ({ movie, onClose }) => {
  if (!movie) return null;

  // Extract YouTube ID from url
  const getEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    if (url.includes('v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0];
    }
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0` : '';
  };

  const embedUrl = getEmbedUrl(movie.trailerUrl);

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(10px)', zIndex: 1060 }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-xl modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content cinema-card border-0 overflow-hidden" style={{ background: '#05070b' }}>
          <div className="modal-header border-0 pb-0 justify-content-between">
            <h5 className="modal-title cinema-heading text-white text-truncate">
              {movie.title} – Official Trailer
            </h5>
            <button
              type="button"
              className="btn btn-link text-white p-1 shadow-none"
              onClick={onClose}
              aria-label="Close trailer"
            >
              <FaTimes size={22} />
            </button>
          </div>

          <div className="modal-body p-2 p-md-3">
            <div className="ratio ratio-16x9 rounded-3 overflow-hidden shadow-lg bg-black">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={`${movie.title} Trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="d-flex align-items-center justify-content-center text-secondary">
                  <span>Trailer video unavailable for this title.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrailerModal;
