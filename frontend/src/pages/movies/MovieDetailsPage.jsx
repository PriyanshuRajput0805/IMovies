import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaStar, FaPlay, FaClock, FaCalendarAlt, FaTv, FaMapMarkerAlt, FaTicketAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import TrailerModal from '../../components/movies/TrailerModal.jsx';

export const MovieDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loadingMovie, setLoadingMovie] = useState(true);
  const [loadingShows, setLoadingShows] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);

  // Available dates for booking: next 5 days
  const generateDates = () => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      list.push({
        dateStr: d.toISOString().split('T')[0],
        dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        formatted: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
      });
    }
    return list;
  };

  const datesList = generateDates();
  const [selectedDate, setSelectedDate] = useState(datesList[0].dateStr);

  // 1. Fetch Movie
  useEffect(() => {
    const fetchMovie = async () => {
      setLoadingMovie(true);
      try {
        const res = await api.get(`/movies/${id}`);
        setMovie(res.data);
      } catch (err) {
        toast.error('Movie not found');
        navigate('/movies');
      } finally {
        setLoadingMovie(false);
      }
    };
    fetchMovie();
  }, [id, navigate]);

  // 2. Fetch Shows for this Movie & Date
  useEffect(() => {
    const fetchShows = async () => {
      setLoadingShows(true);
      try {
        const res = await api.get(`/shows?movieId=${id}&date=${selectedDate}`);
        setShows(res.data);
      } catch (err) {
        console.warn('Failed to load shows for movie:', err);
      } finally {
        setLoadingShows(false);
      }
    };
    if (id) fetchShows();
  }, [id, selectedDate]);

  if (loadingMovie) {
    return (
      <div className="container py-5 text-center text-secondary">
        <div className="spinner-border text-warning mb-3" role="status"></div>
        <p>Loading movie details...</p>
      </div>
    );
  }

  if (!movie) return null;

  // Group shows by Theatre
  const showsByTheatre = shows.reduce((acc, show) => {
    const tId = show.theatreId?._id || 'other';
    if (!acc[tId]) {
      acc[tId] = {
        theatre: show.theatreId,
        shows: []
      };
    }
    acc[tId].shows.push(show);
    return acc;
  }, {});

  return (
    <div>
      {/* Backdrop Header Banner */}
      <div
        className="position-relative py-5 overflow-hidden"
        style={{
          background: `linear-gradient(to bottom, rgba(7, 9, 14, 0.8) 0%, rgba(7, 9, 14, 0.98) 100%), url(${movie.backdrop || movie.poster}) center 20% / cover no-repeat`,
          minHeight: '440px'
        }}
      >
        <div className="container px-4 py-4 position-relative z-1">
          <div className="row align-items-center g-4">
            {/* Poster */}
            <div className="col-12 col-md-4 col-lg-3 text-center text-md-start">
              <div
                className="position-relative d-inline-block rounded-4 overflow-hidden shadow-2xl"
                style={{
                  width: '240px',
                  aspectRatio: '2/3',
                  border: '2px solid rgba(245, 158, 11, 0.3)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)'
                }}
              >
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-100 h-100 object-fit-cover"
                />
              </div>
            </div>

            {/* Movie Info */}
            <div className="col-12 col-md-8 col-lg-9">
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                <span className="badge badge-gold d-inline-flex align-items-center gap-1">
                  <FaStar /> {movie.rating} Rating
                </span>
                <span className="badge badge-red">{movie.certification}</span>
                <span className="badge bg-secondary bg-opacity-50 text-light">
                  {movie.formats?.join(' • ')}
                </span>
                <span className="badge bg-dark border border-secondary text-secondary">
                  {movie.languages?.join(', ')}
                </span>
              </div>

              <h1 className="display-4 fw-extrabold text-white cinema-heading mb-2">
                {movie.title}
              </h1>

              <div className="d-flex align-items-center gap-3 text-secondary small mb-3">
                <span className="d-flex align-items-center gap-1">
                  <FaClock size={12} /> {movie.duration} minutes
                </span>
                <span>&bull;</span>
                <span className="d-flex align-items-center gap-1">
                  <FaCalendarAlt size={12} /> {new Date(movie.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>

              {/* Genres */}
              <div className="d-flex flex-wrap gap-2 mb-3">
                {movie.genres?.map((g) => (
                  <span key={g} className="badge bg-dark text-warning border border-secondary px-2 py-1">
                    {g}
                  </span>
                ))}
              </div>

              {/* Synopsis */}
              <p className="text-light text-opacity-80 lead fs-6 mb-4" style={{ maxWidth: '720px' }}>
                {movie.description}
              </p>

              {/* Cast & Director */}
              <div className="row g-2 text-secondary small mb-4" style={{ maxWidth: '720px' }}>
                {movie.director && (
                  <div className="col-12 col-sm-6">
                    <span className="text-muted">Director:</span>{' '}
                    <strong className="text-white">{movie.director}</strong>
                  </div>
                )}
                {movie.cast && movie.cast.length > 0 && (
                  <div className="col-12">
                    <span className="text-muted">Cast:</span>{' '}
                    <span className="text-light">{movie.cast.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="d-flex flex-wrap align-items-center gap-3">
                <a href="#showtimes" className="btn btn-cinema-primary px-4 py-2 d-inline-flex align-items-center gap-2">
                  <FaTicketAlt /> Select Showtimes
                </a>
                {movie.trailerUrl && (
                  <button
                    onClick={() => setShowTrailer(true)}
                    className="btn btn-cinema-outline px-4 py-2 d-inline-flex align-items-center gap-2"
                  >
                    <FaPlay size={12} /> Watch Official Trailer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Showtimes & Theatres Booking Section */}
      <div id="showtimes" className="container py-5">
        {/* Date Selector Tabs */}
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 pb-3 mb-4 border-bottom" style={{ borderColor: 'var(--imovies-border)' }}>
          <div>
            <h3 className="cinema-heading text-white m-0 d-flex align-items-center gap-2">
              <FaTicketAlt style={{ color: 'var(--imovies-primary)' }} /> Available Showtimes
            </h3>
            <p className="text-secondary small m-0">Choose your preferred screening date, theatre, and showtime.</p>
          </div>

          <div className="d-flex gap-2 overflow-x-auto pb-1">
            {datesList.map((dt) => (
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

        {/* Theatres and Show Listings */}
        {loadingShows ? (
          <div className="text-center py-5 text-secondary">
            <div className="spinner-border text-warning mb-2" role="status"></div>
            <p>Loading available show schedules...</p>
          </div>
        ) : Object.keys(showsByTheatre).length === 0 ? (
          <div className="cinema-card p-5 text-center">
            <h5 className="cinema-heading text-white mb-2">No Screenings Available</h5>
            <p className="text-secondary small mb-3">
              There are no bookable shows for <strong>{movie.title}</strong> on the selected date. Please pick another date above.
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-4">
            {Object.values(showsByTheatre).map(({ theatre, shows: tShows }) => (
              <div key={theatre?._id} className="cinema-card p-4">
                {/* Theatre Header */}
                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 pb-3 mb-3 border-bottom" style={{ borderColor: 'var(--imovies-border)' }}>
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <h5 className="cinema-heading text-white m-0">{theatre?.name}</h5>
                      <span className="badge badge-gold">{theatre?.city}</span>
                    </div>
                    <p className="text-secondary small m-0 d-flex align-items-center gap-1">
                      <FaMapMarkerAlt size={12} style={{ color: 'var(--imovies-primary)' }} />
                      {theatre?.address}
                    </p>
                  </div>

                  {/* Amenities */}
                  <div className="d-flex flex-wrap gap-1">
                    {theatre?.amenities?.slice(0, 3).map((a) => (
                      <span key={a} className="badge bg-dark text-muted border border-secondary" style={{ fontSize: '0.65rem' }}>
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Showtimes Grid */}
                <div className="d-flex flex-wrap gap-3">
                  {tShows.map((show) => (
                    <Link
                      key={show._id}
                      to={`/shows/${show._id}/seats`}
                      className="p-3 rounded-3 text-decoration-none transition-all showtime-button cinema-card"
                      style={{
                        background: '#0c101a',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        minWidth: '150px'
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                        <span className="fw-bold text-white fs-6">{show.startTime}</span>
                        <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                          {show.format}
                        </span>
                      </div>
                      <div className="text-secondary small d-flex align-items-center gap-1 mb-1">
                        <FaTv size={10} /> {show.screenId?.name || 'Screen'}
                      </div>
                      <div className="small text-warning fw-semibold">
                        from ₹{show.pricing?.standard || 200}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      {showTrailer && (
        <TrailerModal movie={movie} onClose={() => setShowTrailer(false)} />
      )}
    </div>
  );
};

export default MovieDetailsPage;
