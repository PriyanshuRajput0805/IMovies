import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FaArrowLeft,
  FaClock,
  FaCheckCircle,
  FaLock,
  FaChair,
  FaWheelchair,
  FaInfoCircle,
  FaTicketAlt,
  FaShieldAlt,
  FaTrashAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import socketService from '../../services/socket.js';

export const SeatSelectionPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [lockingLoading, setLockingLoading] = useState(false);

  const timerRef = useRef(null);

  // 1. Fetch Seating Layout & Real-Time Availability
  const fetchSeatingData = async () => {
    try {
      const res = await api.get(`/shows/${showId}/seats`);
      setData(res.data);

      // Check if user already holds locks for this show
      const myLockedSeats = [];
      res.data.seatingMatrix.forEach((row) => {
        row.seats.forEach((seat) => {
          if (seat.status === 'locked_by_me') {
            myLockedSeats.push(seat);
          }
        });
      });

      if (myLockedSeats.length > 0) {
        setSelectedSeats(myLockedSeats);
        setIsLockedByMe(true);
        // Estimate remaining seconds from first locked seat
        const lockExpiry = new Date(myLockedSeats[0].lockedUntil).getTime();
        const diffSeconds = Math.max(0, Math.floor((lockExpiry - Date.now()) / 1000));
        setRemainingSeconds(diffSeconds > 0 ? diffSeconds : 600);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load theatre seating layout');
      navigate('/movies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeatingData();
  }, [showId]);

  // 2. Socket.IO Real-Time Synchronization
  useEffect(() => {
    const socket = socketService.getSocket();
    socketService.joinShow(showId);

    const handleSeatsLocked = ({ seats, lockedBy }) => {
      // If locked by someone else, update UI to reflect locked state
      setData((prev) => {
        if (!prev) return prev;
        const newMatrix = prev.seatingMatrix.map((row) => ({
          ...row,
          seats: row.seats.map((seat) => {
            if (seats.includes(seat.seatIdentifier)) {
              const isMine = user && lockedBy && String(user._id) === String(lockedBy);
              return {
                ...seat,
                status: isMine ? 'locked_by_me' : 'locked'
              };
            }
            return seat;
          })
        }));
        return { ...prev, seatingMatrix: newMatrix };
      });
    };

    const handleSeatsUnlocked = ({ seats }) => {
      setData((prev) => {
        if (!prev) return prev;
        const newMatrix = prev.seatingMatrix.map((row) => ({
          ...row,
          seats: row.seats.map((seat) => {
            if (seats.includes(seat.seatIdentifier)) {
              return { ...seat, status: 'available' };
            }
            return seat;
          })
        }));
        return { ...prev, seatingMatrix: newMatrix };
      });
    };

    const handleSeatsBooked = ({ seats }) => {
      setData((prev) => {
        if (!prev) return prev;
        const newMatrix = prev.seatingMatrix.map((row) => ({
          ...row,
          seats: row.seats.map((seat) => {
            if (seats.includes(seat.seatIdentifier)) {
              return { ...seat, status: 'booked' };
            }
            return seat;
          })
        }));
        return { ...prev, seatingMatrix: newMatrix };
      });
    };

    socket.on('seats_locked', handleSeatsLocked);
    socket.on('seats_unlocked', handleSeatsUnlocked);
    socket.on('seats_booked', handleSeatsBooked);

    return () => {
      socket.off('seats_locked', handleSeatsLocked);
      socket.off('seats_unlocked', handleSeatsUnlocked);
      socket.off('seats_booked', handleSeatsBooked);
      socketService.leaveShow(showId);
    };
  }, [showId, user]);

  // 3. Countdown Timer for Active Seat Lock (10 minutes)
  useEffect(() => {
    if (isLockedByMe && remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsLockedByMe(false);
            setSelectedSeats([]);
            toast.warn('Your 10-minute seat reservation has expired. Please reselect your seats.');
            fetchSeatingData();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isLockedByMe, remainingSeconds]);

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  // Toggle seat selection
  const handleSeatClick = (seat) => {
    // If seat is permanently booked
    if (seat.status === 'booked') {
      toast.info(`Seat ${seat.seatIdentifier} is already booked.`);
      return;
    }

    // If seat is locked by someone else
    if (seat.status === 'locked') {
      toast.info(`Seat ${seat.seatIdentifier} is currently in checkout by another customer.`);
      return;
    }

    // Check if already selected
    const isSelected = selectedSeats.some((s) => s.seatIdentifier === seat.seatIdentifier);

    if (isSelected) {
      setSelectedSeats(selectedSeats.filter((s) => s.seatIdentifier !== seat.seatIdentifier));
      // If we had active DB lock and unselect, we can either keep or release
    } else {
      if (selectedSeats.length >= 8) {
        toast.warning('Maximum 8 tickets allowed per booking.');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  // Lock seats API call
  const handleLockSeats = async () => {
    if (selectedSeats.length === 0) {
      toast.warning('Please select at least one seat to reserve.');
      return;
    }

    if (!user) {
      // Save intent to session storage and redirect to login
      sessionStorage.setItem('imovies_booking_redirect', `/shows/${showId}/seats`);
      toast.info('Please log in or register to reserve your seats.');
      navigate(`/login?redirect=/shows/${showId}/seats`);
      return;
    }

    setLockingLoading(true);
    try {
      const seatIds = selectedSeats.map((s) => s.seatIdentifier);
      const res = await api.post('/bookings/lock-seats', {
        showId,
        seats: seatIds
      });

      setIsLockedByMe(true);
      setRemainingSeconds(res.data.remainingSeconds || 600);
      toast.success('Seats reserved for 10 minutes! Proceed to payment.');

      // Navigate to Checkout page with showId and seat identifiers
      navigate(`/checkout/${showId}?seats=${seatIds.join(',')}`);
    } catch (err) {
      toast.error(err.message || 'Failed to lock seats. Some seats may have just been taken.');
      fetchSeatingData();
    } finally {
      setLockingLoading(false);
    }
  };

  // Release seats API call
  const handleReleaseSeats = async () => {
    if (!isLockedByMe || selectedSeats.length === 0) {
      setSelectedSeats([]);
      return;
    }

    try {
      await api.post('/bookings/unlock-seats', {
        showId,
        seats: selectedSeats.map((s) => s.seatIdentifier)
      });
      setIsLockedByMe(false);
      setSelectedSeats([]);
      toast.info('Seats released.');
      fetchSeatingData();
    } catch (err) {
      toast.error('Failed to release seats: ' + err.message);
    }
  };

  // Pricing calculations
  const { subtotal, convenienceFee, taxes, grandTotal } = useMemo(() => {
    const sub = selectedSeats.reduce((sum, s) => sum + (s.price || 0), 0);
    const fee = selectedSeats.length > 0 ? 30 : 0;
    const tax = Math.round(sub * 0.18);
    const total = sub + fee + tax;
    return { subtotal: sub, convenienceFee: fee, taxes: tax, grandTotal: total };
  }, [selectedSeats]);

  if (loading) {
    return (
      <div className="container py-5 text-center text-secondary">
        <div className="spinner-border text-warning mb-3" role="status"></div>
        <p>Loading interactive seating layout...</p>
      </div>
    );
  }

  if (!data || !data.show) {
    return (
      <div className="container py-5 text-center">
        <h4 className="text-secondary">Show details not available.</h4>
        <Link to="/movies" className="btn btn-cinema-primary mt-3">Back to Movies</Link>
      </div>
    );
  }

  const { show, seatingMatrix } = data;

  return (
    <div className="container-fluid py-4 px-lg-5">
      {/* Top Navigation & Show Banner */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 border-bottom pb-3 border-secondary border-opacity-25">
        <div className="d-flex align-items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-cinema-outline btn-sm p-2 d-flex align-items-center"
            title="Go back"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="h4 fw-bold mb-1 text-white">
              {show.movie?.title}
              <span className="badge badge-gold ms-2 fs-6">{show.format || '2D'}</span>
              <span className="badge bg-secondary ms-2 fs-6">{show.movie?.certification || 'UA'}</span>
            </h1>
            <p className="text-secondary small mb-0 d-flex flex-wrap align-items-center gap-3">
              <span>{show.theatre?.name} ({show.theatre?.city})</span>
              <span>•</span>
              <span>{show.screen?.name}</span>
              <span>•</span>
              <span className="text-warning fw-semibold">{show.showDate} at {show.startTime}</span>
            </p>
          </div>
        </div>

        {/* Live Reservation Countdown Banner */}
        {isLockedByMe && (
          <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 bg-warning bg-opacity-10 border border-warning">
            <FaClock className="text-warning animate-spin" />
            <span className="text-warning fw-semibold small">Seat Lease Remaining:</span>
            <span className="badge bg-warning text-dark fs-6 fw-bold">
              {formatTime(remainingSeconds)}
            </span>
          </div>
        )}
      </div>

      <div className="row g-4">
        {/* Left / Center: Interactive Seating Chart */}
        <div className="col-lg-8 col-xl-9">
          <div className="cinema-card p-4 text-center">
            {/* Screen Direction Visual */}
            <div className="cinema-screen-curve">
              <span className="cinema-screen-glow">SCREEN THIS WAY</span>
            </div>

            {/* Seat Category Pricing Pills */}
            <div className="d-flex flex-wrap justify-content-center gap-3 mb-4">
              <span className="badge p-2 px-3 bg-dark border border-secondary border-opacity-50 text-light d-flex align-items-center gap-2">
                <span className="seat-btn seat-standard" style={{ width: 18, height: 16 }}></span>
                Standard: ₹{show.pricing?.standard || 180}
              </span>
              <span className="badge p-2 px-3 bg-dark border border-cyan border-opacity-50 text-cyan d-flex align-items-center gap-2">
                <span className="seat-btn seat-premium" style={{ width: 18, height: 16 }}></span>
                Premium: ₹{show.pricing?.premium || 250}
              </span>
              <span className="badge p-2 px-3 bg-dark border border-warning border-opacity-50 text-warning d-flex align-items-center gap-2">
                <span className="seat-btn seat-vip" style={{ width: 18, height: 16 }}></span>
                VIP Recliner: ₹{show.pricing?.vip || 350}
              </span>
            </div>

            {/* Seating Grid */}
            <div className="seat-grid-container">
              {seatingMatrix.map((row) => (
                <div key={row.rowLabel} className="seat-row">
                  {/* Row Label Left */}
                  <span className="seat-row-label">{row.rowLabel}</span>

                  {/* Row Seats */}
                  {row.seats.map((seat) => {
                    const isSelected = selectedSeats.some(
                      (s) => s.seatIdentifier === seat.seatIdentifier
                    );
                    let seatClass = `seat-btn seat-${seat.category}`;

                    if (isSelected) {
                      seatClass += ' seat-selected';
                    } else if (seat.status === 'locked_by_me') {
                      seatClass += ' seat-locked-by-me';
                    } else if (seat.status === 'locked') {
                      seatClass += ' seat-locked';
                    } else if (seat.status === 'booked') {
                      seatClass += ' seat-booked';
                    }

                    return (
                      <button
                        key={seat.seatIdentifier}
                        type="button"
                        className={seatClass}
                        disabled={seat.status === 'booked' || (seat.status === 'locked' && !isSelected)}
                        onClick={() => handleSeatClick(seat)}
                        title={`Seat ${seat.seatIdentifier} • ${seat.category.toUpperCase()} • ₹${seat.price}${seat.status === 'locked' ? ' (In Checkout)' : ''}${seat.status === 'booked' ? ' (Sold)' : ''}`}
                        aria-label={`Seat ${seat.seatIdentifier}, category ${seat.category}, price ₹${seat.price}`}
                      >
                        {seat.seatNumber}
                        {seat.isAccessible && <span className="seat-accessible-dot" title="Wheelchair Accessible"></span>}
                      </button>
                    );
                  })}

                  {/* Row Label Right */}
                  <span className="seat-row-label">{row.rowLabel}</span>
                </div>
              ))}
            </div>

            {/* Seating Legend */}
            <div className="d-flex flex-wrap align-items-center justify-content-center gap-4 mt-4 pt-3 border-top border-secondary border-opacity-25 small text-secondary">
              <div className="d-flex align-items-center gap-2">
                <span className="seat-btn seat-standard" style={{ width: 18, height: 16 }}></span>
                <span>Available</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="seat-btn seat-selected" style={{ width: 18, height: 16 }}></span>
                <span className="text-warning fw-semibold">Selected</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="seat-btn seat-locked" style={{ width: 18, height: 16 }}></span>
                <span className="text-orange">Reserved / In Checkout</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="seat-btn seat-booked" style={{ width: 18, height: 16 }}></span>
                <span>Sold Out</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="seat-accessible-dot position-static d-inline-block"></span>
                <span>Wheelchair Accessible</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Booking Summary & Checkout Action */}
        <div className="col-lg-4 col-xl-3">
          <div className="cinema-card p-4 sticky-top" style={{ top: '85px' }}>
            <h2 className="h5 fw-bold text-white mb-3 d-flex align-items-center gap-2">
              <FaTicketAlt className="text-warning" /> Booking Summary
            </h2>

            {/* Selected Seats Chips */}
            <div className="mb-4">
              <label className="text-secondary small fw-semibold mb-2 d-block">
                Selected Seats ({selectedSeats.length} / 8 Max)
              </label>
              {selectedSeats.length === 0 ? (
                <div className="p-3 text-center rounded-3 bg-dark border border-secondary border-opacity-25 text-secondary small">
                  Click on any available seat in the map to begin your reservation.
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {selectedSeats.map((s) => (
                    <span
                      key={s.seatIdentifier}
                      className="badge bg-warning text-dark d-flex align-items-center gap-2 py-2 px-3 fw-bold"
                    >
                      {s.seatIdentifier} ({s.category.toUpperCase()} - ₹{s.price})
                      <button
                        type="button"
                        onClick={() => handleSeatClick(s)}
                        className="btn-close btn-close-white ms-1"
                        style={{ fontSize: '0.6rem' }}
                        aria-label={`Remove seat ${s.seatIdentifier}`}
                      ></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Price Breakdown Calculation */}
            {selectedSeats.length > 0 && (
              <div className="border-top border-secondary border-opacity-25 pt-3 mb-4">
                <div className="d-flex justify-content-between text-secondary small mb-2">
                  <span>Tickets Subtotal ({selectedSeats.length})</span>
                  <span className="text-white">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between text-secondary small mb-2">
                  <span>Integrated GST (18%)</span>
                  <span className="text-white">₹{taxes.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between text-secondary small mb-3">
                  <span>Convenience Fee</span>
                  <span className="text-white">₹{convenienceFee.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between fw-bold fs-5 text-warning border-top border-secondary border-opacity-25 pt-2">
                  <span>Total Amount</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn btn-cinema-primary py-3 fw-bold fs-6"
                disabled={selectedSeats.length === 0 || lockingLoading}
                onClick={handleLockSeats}
              >
                {lockingLoading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                ) : (
                  <FaShieldAlt className="me-2" />
                )}
                {isLockedByMe ? 'Proceed to Payment' : `Lock Seats & Pay ₹${grandTotal.toFixed(2)}`}
              </button>

              {isLockedByMe && (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm py-2"
                  onClick={handleReleaseSeats}
                >
                  <FaTrashAlt className="me-1" /> Release Reserved Seats
                </button>
              )}
            </div>

            <div className="mt-3 text-center text-secondary" style={{ fontSize: '0.75rem' }}>
              <FaInfoCircle className="me-1" />
              Seats are held for 10 minutes upon locking to guarantee no double-booking.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionPage;
