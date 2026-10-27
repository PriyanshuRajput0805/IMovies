import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  FaCheckCircle,
  FaTicketAlt,
  FaPrint,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaTv,
  FaUserCheck,
  FaCreditCard,
  FaFilm
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api.js';

export const BookingConfirmationPage = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        setBooking(res.data);
      } catch (err) {
        toast.error('Failed to load booking details: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  if (loading) {
    return (
      <div className="container py-5 text-center text-secondary">
        <div className="spinner-border text-warning mb-3" role="status"></div>
        <p>Loading digital ticket & QR code...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container py-5 text-center">
        <h4 className="text-secondary">Booking not found.</h4>
        <Link to="/movies" className="btn btn-cinema-primary mt-3">Explore Movies</Link>
      </div>
    );
  }

  const { showId: show, selectedSeats, priceBreakdown, bookingReference, paymentDetails } = booking;
  const qrPayload = JSON.stringify({
    ref: bookingReference,
    showId: show?._id,
    movie: show?.movieId?.title,
    seats: selectedSeats.map((s) => s.seatIdentifier),
    issuedAt: booking.bookedAt
  });

  return (
    <div className="container py-4 py-lg-5">
      {/* Success Banner */}
      <div className="text-center mb-5">
        <div className="d-inline-flex p-3 rounded-circle bg-emerald bg-opacity-20 text-emerald mb-3">
          <FaCheckCircle size={48} className="text-emerald" />
        </div>
        <h1 className="h3 fw-bold text-white mb-2">Booking Confirmed!</h1>
        <p className="text-secondary mb-0">
          Your ticket reservation has been verified. Present this digital QR pass at the cinema entrance.
        </p>
      </div>

      {/* Digital Ticket Card */}
      <div className="cinema-card mx-auto overflow-hidden shadow-lg" style={{ maxWidth: '780px' }}>
        {/* Ticket Header Bar */}
        <div
          className="p-3 px-4 d-flex flex-wrap align-items-center justify-content-between gap-3 text-dark"
          style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
        >
          <div className="d-flex align-items-center gap-2 fw-bold fs-5">
            <FaTicketAlt /> IMovies Digital Pass
          </div>
          <div className="fw-bold fs-5 letter-spacing-1 font-monospace">
            REF: {bookingReference}
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-4 p-md-5">
          <div className="row g-4 align-items-center">
            {/* Left: Movie & Showtime Info */}
            <div className="col-md-7 border-end border-secondary border-opacity-25 pe-md-4">
              <div className="d-flex gap-3 mb-4">
                <img
                  src={show?.movieId?.poster}
                  alt={show?.movieId?.title}
                  className="rounded-3 shadow"
                  style={{ width: '90px', height: '128px', objectFit: 'cover' }}
                />
                <div>
                  <h2 className="h4 fw-bold text-white mb-1">{show?.movieId?.title}</h2>
                  <div className="d-flex gap-2 mb-2">
                    <span className="badge badge-gold">{show?.format || '2D'}</span>
                    <span className="badge bg-secondary">{show?.movieId?.certification || 'UA'}</span>
                    <span className="badge bg-dark border border-secondary text-secondary">
                      {show?.movieId?.duration || 150} min
                    </span>
                  </div>
                  <div className="text-secondary small d-flex align-items-center gap-2 mb-1">
                    <FaMapMarkerAlt className="text-warning flex-shrink-0" />
                    <span>{show?.theatreId?.name}, {show?.theatreId?.city}</span>
                  </div>
                  <div className="text-secondary small d-flex align-items-center gap-2">
                    <FaTv className="text-cyan flex-shrink-0" />
                    <span>{show?.screenId?.name}</span>
                  </div>
                </div>
              </div>

              {/* Show Details Grid */}
              <div className="row g-3 py-3 border-top border-bottom border-secondary border-opacity-25 mb-3 text-secondary small">
                <div className="col-6">
                  <div className="text-uppercase fw-semibold text-subtle" style={{ fontSize: '0.7rem' }}>
                    Show Date
                  </div>
                  <div className="text-white fw-bold d-flex align-items-center gap-1 mt-1">
                    <FaCalendarAlt className="text-warning" /> {show?.showDate}
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-uppercase fw-semibold text-subtle" style={{ fontSize: '0.7rem' }}>
                    Show Time
                  </div>
                  <div className="text-white fw-bold d-flex align-items-center gap-1 mt-1">
                    <FaClock className="text-warning" /> {show?.startTime}
                  </div>
                </div>
              </div>

              {/* Seats Info */}
              <div>
                <div className="text-uppercase fw-semibold text-secondary mb-2" style={{ fontSize: '0.7rem' }}>
                  Confirmed Seats ({selectedSeats.length} Tickets)
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {selectedSeats.map((s) => (
                    <span key={s.seatIdentifier} className="badge bg-warning text-dark py-2 px-3 fw-bold fs-6">
                      {s.seatIdentifier} ({s.category?.toUpperCase()})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Digital QR Code Pass */}
            <div className="col-md-5 text-center ps-md-4">
              <div className="p-3 bg-white rounded-3 d-inline-block shadow-sm mb-3">
                <QRCodeSVG
                  value={qrPayload}
                  size={160}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <div className="font-monospace text-warning fw-bold small mb-2">
                {bookingReference}
              </div>
              <div className="text-secondary small">
                Scan at the usher turnstile for rapid ticket validation.
              </div>

              <div className="mt-4 pt-3 border-top border-secondary border-opacity-25 text-start small">
                <div className="d-flex justify-content-between text-secondary mb-1">
                  <span>Total Paid:</span>
                  <span className="text-white fw-bold">₹{priceBreakdown?.totalAmount?.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between text-secondary">
                  <span>Payment ID:</span>
                  <span className="text-light font-monospace" style={{ fontSize: '0.75rem' }}>
                    {paymentDetails?.razorpayPaymentId || 'pay_online'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Footer Action Buttons */}
        <div className="p-3 px-4 bg-dark border-top border-secondary border-opacity-25 d-flex flex-wrap justify-content-between align-items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-cinema-outline btn-sm d-flex align-items-center gap-2"
          >
            <FaPrint /> Print / Download PDF
          </button>

          <div className="d-flex gap-2">
            <Link to="/my-bookings" className="btn btn-cinema-outline btn-sm">
              My Bookings
            </Link>
            <Link to="/movies" className="btn btn-cinema-primary btn-sm">
              <FaFilm className="me-1" /> Discover More Movies
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
