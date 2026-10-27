import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaTicketAlt,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaTv,
  FaQrcode,
  FaCheckCircle,
  FaFilm
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api.js';

export const BookingHistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'confirmed' | 'cancelled'
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings/my-bookings');
      setBookings(res.data);
    } catch (err) {
      toast.error('Failed to load your booking history: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId, bookingRef) => {
    if (!window.confirm(`Are you sure you want to cancel booking ${bookingRef}? A refund will be initiated to your original payment method.`)) {
      return;
    }

    setCancellingId(bookingId);
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      toast.success(`Booking ${bookingRef} has been cancelled successfully.`);
      fetchBookings();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'confirmed') return b.bookingStatus === 'confirmed';
    if (filter === 'cancelled') return b.bookingStatus === 'cancelled';
    return true;
  });

  const totalSpent = bookings
    .filter((b) => b.bookingStatus === 'confirmed')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const activeCount = bookings.filter((b) => b.bookingStatus === 'confirmed').length;

  return (
    <div className="container py-4 py-lg-5">
      {/* Header Banner */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 border-bottom pb-3 border-secondary border-opacity-25">
        <div>
          <h1 className="h3 fw-bold text-white mb-1 d-flex align-items-center gap-2">
            <FaTicketAlt className="text-warning" /> My Bookings & Tickets
          </h1>
          <p className="text-secondary small mb-0">
            View active movie passes, digital QR codes, and past transaction records.
          </p>
        </div>

        <Link to="/movies" className="btn btn-cinema-primary btn-sm">
          <FaFilm className="me-1" /> Book New Movie
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4">
          <div className="cinema-card p-3">
            <div className="text-secondary small fw-semibold text-uppercase">Total Bookings</div>
            <div className="fs-3 fw-bold text-white mt-1">{bookings.length}</div>
          </div>
        </div>
        <div className="col-6 col-md-4">
          <div className="cinema-card p-3">
            <div className="text-secondary small fw-semibold text-uppercase">Active Passes</div>
            <div className="fs-3 fw-bold text-emerald mt-1">{activeCount}</div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="cinema-card p-3">
            <div className="text-secondary small fw-semibold text-uppercase">Total Spent</div>
            <div className="fs-3 fw-bold text-warning mt-1">₹{totalSpent.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-4">
        <button
          type="button"
          className={`btn btn-sm px-3 ${filter === 'all' ? 'btn-cinema-primary' : 'btn-cinema-outline'}`}
          onClick={() => setFilter('all')}
        >
          All ({bookings.length})
        </button>
        <button
          type="button"
          className={`btn btn-sm px-3 ${filter === 'confirmed' ? 'btn-cinema-primary' : 'btn-cinema-outline'}`}
          onClick={() => setFilter('confirmed')}
        >
          Active / Confirmed ({activeCount})
        </button>
        <button
          type="button"
          className={`btn btn-sm px-3 ${filter === 'cancelled' ? 'btn-cinema-primary' : 'btn-cinema-outline'}`}
          onClick={() => setFilter('cancelled')}
        >
          Cancelled ({bookings.length - activeCount})
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="container py-5 text-center text-secondary">
          <div className="spinner-border text-warning mb-3" role="status"></div>
          <p>Loading your booking history...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="cinema-card p-5 text-center">
          <FaTicketAlt size={48} className="text-secondary mb-3 opacity-50" />
          <h4 className="text-white fw-bold mb-2">No Bookings Found</h4>
          <p className="text-secondary mb-4">
            {filter === 'all'
              ? "You haven't reserved any cinema tickets yet. Explore current releases and select your seats!"
              : `No ${filter} bookings available.`}
          </p>
          <Link to="/movies" className="btn btn-cinema-primary">
            Explore Current Movies
          </Link>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filteredBookings.map((b) => {
            const show = b.showId;
            const movie = show?.movieId;
            const isCancelled = b.bookingStatus === 'cancelled';

            return (
              <div
                key={b._id}
                className="cinema-card p-4 overflow-hidden position-relative"
                style={{ opacity: isCancelled ? 0.75 : 1 }}
              >
                {/* Reference & Status Header */}
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom border-secondary border-opacity-25 pb-3 mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="font-monospace fw-bold text-warning fs-6">
                      REF: {b.bookingReference}
                    </span>
                    <span className="text-secondary small">
                      • Booked on {new Date(b.bookedAt || b.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    {isCancelled ? (
                      <span className="badge bg-danger">Cancelled</span>
                    ) : (
                      <span className="badge badge-emerald">
                        <FaCheckCircle className="me-1" /> Confirmed
                      </span>
                    )}
                  </div>
                </div>

                <div className="row g-3 align-items-center">
                  {/* Poster & Movie Title */}
                  <div className="col-md-5 d-flex gap-3 align-items-center">
                    <img
                      src={movie?.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400'}
                      alt={movie?.title}
                      className="rounded-2 shadow-sm"
                      style={{ width: '64px', height: '92px', objectFit: 'cover' }}
                    />
                    <div>
                      <h2 className="h6 fw-bold text-white mb-1">{movie?.title || 'Movie Title'}</h2>
                      <div className="d-flex gap-2 mb-1">
                        <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>
                          {show?.format || '2D'}
                        </span>
                        <span className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>
                          {movie?.certification || 'UA'}
                        </span>
                      </div>
                      <div className="text-secondary small d-flex align-items-center gap-1">
                        <FaMapMarkerAlt className="text-warning" size={11} />
                        <span>{show?.theatreId?.name || 'Multiplex'}</span>
                      </div>
                      <div className="text-secondary small d-flex align-items-center gap-1">
                        <FaTv className="text-cyan" size={11} />
                        <span>{show?.screenId?.name || 'Screen'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Show Date, Time, and Seats */}
                  <div className="col-md-4">
                    <div className="d-flex align-items-center gap-3 text-secondary small mb-2">
                      <span className="text-white fw-semibold d-flex align-items-center gap-1">
                        <FaCalendarAlt className="text-warning" /> {show?.showDate}
                      </span>
                      <span>•</span>
                      <span className="text-white fw-semibold d-flex align-items-center gap-1">
                        <FaClock className="text-warning" /> {show?.startTime}
                      </span>
                    </div>

                    <div className="small text-secondary mb-1">
                      Seats ({b.selectedSeats?.length} Tickets):
                    </div>
                    <div className="d-flex flex-wrap gap-1">
                      {b.selectedSeats?.map((s) => (
                        <span key={s.seatIdentifier} className="badge bg-dark border border-secondary text-warning">
                          {s.seatIdentifier}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing and Action Buttons */}
                  <div className="col-md-3 text-md-end">
                    <div className="fs-5 fw-bold text-white mb-2">
                      ₹{b.totalAmount?.toFixed(2)}
                    </div>

                    <div className="d-flex flex-column gap-2 justify-content-md-end">
                      <Link
                        to={`/booking-confirmation/${b._id}`}
                        className="btn btn-cinema-primary btn-sm d-flex align-items-center justify-content-center gap-2"
                      >
                        <FaQrcode /> View Digital Ticket
                      </Link>

                      {!isCancelled && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          disabled={cancellingId === b._id}
                          onClick={() => handleCancel(b._id, b.bookingReference)}
                        >
                          {cancellingId === b._id ? 'Cancelling...' : 'Cancel Booking'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingHistoryPage;
