import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaTv, FaTicketAlt, FaClock } from 'react-icons/fa';
import api from '../../services/api.js';

export const TheatreDetailsPage = () => {
  const { id } = useParams();

  const [theatre, setTheatre] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Next 5 days
  const today = new Date();
  const dates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      formatted: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
    };
  });

  const [selectedDate, setSelectedDate] = useState(dates[0].dateStr);

  useEffect(() => {
    const fetchTheatreData = async () => {
      setLoading(true);
      try {
        const [tRes, sRes] = await Promise.all([
          api.get(`/theatres/${id}`),
          api.get(`/shows?theatreId=${id}&date=${selectedDate}`)
        ]);
        setTheatre(tRes.data);
        setShows(sRes.data);
      } catch (err) {
        console.error('Failed to load theatre details:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTheatreData();
  }, [id, selectedDate]);

  if (loading) {
    return (
      <div className="container py-5 text-center text-secondary">
        <div className="spinner-border text-warning mb-3" role="status"></div>
        <p>Loading theatre details...</p>
      </div>
    );
  }

  if (!theatre) {
    return (
      <div className="container py-5 text-center">
        <h4>Theatre Not Found</h4>
        <Link to="/theatres" className="btn btn-cinema-primary mt-3">Back to Theatres</Link>
      </div>
    );
  }

  // Group shows by Movie
  const showsByMovie = shows.reduce((acc, show) => {
    const mId = show.movieId?._id || 'other';
    if (!acc[mId]) {
      acc[mId] = {
        movie: show.movieId,
        shows: []
      };
    }
    acc[mId].shows.push(show);
    return acc;
  }, {});

  return (
    <div className="container py-4">
      {/* Theatre Header Card */}
      <div className="cinema-card p-4 p-md-5 mb-5" style={{ background: 'linear-gradient(180deg, #121929 0%, #0a0e17 100%)' }}>
        <div className="d-flex flex-column flex-md-row align-items-md-start justify-content-between gap-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge badge-gold px-3 py-1 rounded-pill">{theatre.city}</span>
              <span className="badge bg-secondary small">{theatre.screens?.length || 2} Auditoriums</span>
            </div>
            <h2 className="cinema-heading text-white mb-2">{theatre.name}</h2>
            <p className="text-secondary small mb-3 d-flex align-items-center gap-1">
              <FaMapMarkerAlt style={{ color: 'var(--imovies-primary)' }} />
              {theatre.address}, {theatre.state} {theatre.zipCode}
            </p>

            {/* Contact info */}
            <div className="d-flex flex-wrap gap-3 text-secondary small mb-3">
              {theatre.phone && (
                <span className="d-flex align-items-center gap-1">
                  <FaPhone size={12} /> {theatre.phone}
                </span>
              )}
              {theatre.email && (
                <span className="d-flex align-items-center gap-1">
                  <FaEnvelope size={12} /> {theatre.email}
                </span>
              )}
            </div>

            {/* Amenities */}
            <div className="d-flex flex-wrap gap-1">
              {theatre.amenities?.map((a) => (
                <span key={a} className="badge bg-dark text-warning border border-secondary" style={{ fontSize: '0.7rem' }}>
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Date Picker Bar */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 pb-3 mb-4 border-bottom" style={{ borderColor: 'var(--imovies-border)' }}>
        <div>
          <h4 className="cinema-heading text-white m-0 d-flex align-items-center gap-2">
            <FaTicketAlt style={{ color: 'var(--imovies-primary)' }} /> Screening Schedule
          </h4>
          <p className="text-secondary small m-0">Pick a date to browse all movies playing at this theatre.</p>
        </div>

        <div className="d-flex gap-2 overflow-x-auto pb-1">
          {dates.map((dt) => (
            <button
              key={dt.dateStr}
              onClick={() => setSelectedDate(dt.dateStr)}
              className={`btn btn-sm d-flex flex-column align-items-center px-3 py-2 rounded-3 text-nowrap ${selectedDate === dt.dateStr ? 'btn-cinema-primary' : 'btn-cinema-outline'}`}
              style={{ minWidth: '78px' }}
            >
              <span className="small text-uppercase fw-bold">{dt.dayName}</span>
              <span style={{ fontSize: '0.85rem' }}>{dt.formatted}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Movies Playing */}
      {Object.keys(showsByMovie).length === 0 ? (
        <div className="cinema-card p-5 text-center">
          <h5 className="cinema-heading text-white mb-2">No Screenings Today</h5>
          <p className="text-secondary small mb-0">
            There are no shows scheduled at this theatre for the selected date. Please pick another date above.
          </p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {Object.values(showsByMovie).map(({ movie, shows: mShows }) => (
            <div key={movie?._id} className="cinema-card p-4">
              <div className="row align-items-center g-3">
                {/* Movie Thumbnail */}
                <div className="col-auto">
                  <img
                    src={movie?.poster}
                    alt={movie?.title}
                    style={{ width: '64px', height: '88px', objectFit: 'cover', borderRadius: '8px' }}
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100'; }}
                  />
                </div>

                {/* Movie Meta */}
                <div className="col-12 col-md-4">
                  <Link to={`/movies/${movie?._id}`} className="text-decoration-none">
                    <h5 className="cinema-heading text-white mb-1 hover-warning">{movie?.title}</h5>
                  </Link>
                  <div className="d-flex align-items-center gap-2 text-secondary small mb-1">
                    <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>{movie?.certification}</span>
                    <span>{movie?.duration}m</span>
                    <span>&bull;</span>
                    <span>{movie?.genres?.slice(0, 2).join(', ')}</span>
                  </div>
                </div>

                {/* Showtimes Pill Buttons */}
                <div className="col-12 col-md-7">
                  <div className="d-flex flex-wrap gap-2">
                    {mShows.map((s) => (
                      <Link
                        key={s._id}
                        to={`/shows/${s._id}/seats`}
                        className="p-2 px-3 rounded-2 text-decoration-none cinema-card"
                        style={{
                          background: '#0a0d14',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          minWidth: '120px'
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between gap-2">
                          <span className="fw-bold text-white small">{s.startTime}</span>
                          <span className="badge badge-emerald" style={{ fontSize: '0.6rem' }}>{s.format}</span>
                        </div>
                        <div className="text-secondary small" style={{ fontSize: '0.7rem' }}>
                          <FaTv size={9} /> {s.screenId?.name?.split('-')[0] || 'Screen'}
                        </div>
                        <div className="text-warning small" style={{ fontSize: '0.75rem' }}>
                          from ₹{s.pricing?.standard}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TheatreDetailsPage;
