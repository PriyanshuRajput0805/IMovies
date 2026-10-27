import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FaArrowLeft,
  FaShieldAlt,
  FaLock,
  FaCreditCard,
  FaMobileAlt,
  FaUniversity,
  FaBolt,
  FaCheckCircle,
  FaTicketAlt,
  FaInfoCircle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api.js';

export const CheckoutPage = () => {
  const { showId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const seatsParam = searchParams.get('seats');
  const seatsList = seatsParam ? seatsParam.split(',').filter(Boolean) : [];

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('instant'); // 'instant' | 'upi' | 'card' | 'netbanking'
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [upiId, setUpiId] = useState('customer@imovies');
  const [cardData, setCardData] = useState({
    number: '4532 •••• •••• 8892',
    name: user?.name || 'Customer Name',
    expiry: '12/28',
    cvv: '884'
  });
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  useEffect(() => {
    if (!seatsParam || seatsList.length === 0) {
      toast.warning('No seats selected for checkout.');
      navigate(`/shows/${showId}/seats`);
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await api.post('/payments/create-order', {
          showId,
          seats: seatsList
        });
        setOrderData(res.data);
      } catch (err) {
        toast.error(err.message || 'Failed to prepare payment order');
        navigate(`/shows/${showId}/seats`);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [showId, seatsParam]);

  const handlePayment = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);

    try {
      let res;
      if (selectedMethod === 'instant') {
        // 1-Click Instant Mock Checkout
        res = await api.post('/payments/mock-checkout', {
          showId,
          seats: seatsList,
          paymentMethod: 'instant_demo'
        });
      } else {
        // Standard Gateway Verification Flow
        res = await api.post('/payments/verify', {
          showId,
          seats: seatsList,
          razorpayOrderId: orderData?.orderId || `ord_${Date.now()}`,
          razorpayPaymentId: `pay_${selectedMethod}_${Date.now()}`,
          razorpaySignature: 'mock_verified_signature',
          isMock: true,
          paymentMethod: selectedMethod
        });
      }

      toast.success('Payment verified! Your tickets have been confirmed.');
      navigate(`/booking-confirmation/${res.data._id}`);
    } catch (err) {
      toast.error(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center text-secondary">
        <div className="spinner-border text-warning mb-3" role="status"></div>
        <p>Securing checkout session & creating payment order...</p>
      </div>
    );
  }

  if (!orderData) return null;

  const { pricing, show, seats } = orderData;

  return (
    <div className="container py-4 py-lg-5">
      {/* Checkout Header */}
      <div className="d-flex align-items-center gap-3 mb-4 border-bottom pb-3 border-secondary border-opacity-25">
        <button
          onClick={() => navigate(`/shows/${showId}/seats`)}
          className="btn btn-cinema-outline btn-sm p-2"
          title="Back to Seat Selection"
        >
          <FaArrowLeft />
        </button>
        <div>
          <h1 className="h4 fw-bold text-white mb-0">Secure Checkout & Payment</h1>
          <p className="text-secondary small mb-0 d-flex align-items-center gap-2">
            <FaShieldAlt className="text-emerald" /> 256-bit Encrypted Cinema Booking Gateway
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* Left: Payment Options & Forms */}
        <div className="col-lg-7 col-xl-8">
          <div className="cinema-card p-4 mb-4">
            <h2 className="h5 fw-bold text-white mb-3">Select Payment Method</h2>

            {/* Method Tabs */}
            <div className="d-flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 ${
                  selectedMethod === 'instant' ? 'btn-cinema-primary' : 'btn-cinema-outline'
                }`}
                onClick={() => setSelectedMethod('instant')}
              >
                <FaBolt /> 1-Click Instant Demo
              </button>
              <button
                type="button"
                className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 ${
                  selectedMethod === 'upi' ? 'btn-cinema-primary' : 'btn-cinema-outline'
                }`}
                onClick={() => setSelectedMethod('upi')}
              >
                <FaMobileAlt /> UPI / QR
              </button>
              <button
                type="button"
                className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 ${
                  selectedMethod === 'card' ? 'btn-cinema-primary' : 'btn-cinema-outline'
                }`}
                onClick={() => setSelectedMethod('card')}
              >
                <FaCreditCard /> Credit / Debit Card
              </button>
              <button
                type="button"
                className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 ${
                  selectedMethod === 'netbanking' ? 'btn-cinema-primary' : 'btn-cinema-outline'
                }`}
                onClick={() => setSelectedMethod('netbanking')}
              >
                <FaUniversity /> Net Banking
              </button>
            </div>

            {/* Method Content */}
            <form onSubmit={handlePayment}>
              {selectedMethod === 'instant' && (
                <div className="p-4 rounded-3 bg-dark border border-warning border-opacity-50 text-center">
                  <div className="badge badge-gold fs-6 mb-3 px-3 py-2">
                    <FaBolt className="me-1" /> Fast-Track Verification
                  </div>
                  <h4 className="h5 fw-bold text-white mb-2">Instant Demo Payment Mode</h4>
                  <p className="text-secondary small mb-4 mx-auto" style={{ maxWidth: '480px' }}>
                    Simulates instant Razorpay gateway success, completes atomic zero-concurrency booking,
                    releases the temporary seat hold, and issues your digital QR ticket immediately.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-cinema-primary px-4 py-2 fs-6 fw-bold"
                  >
                    {submitting ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    ) : (
                      <FaCheckCircle className="me-2" />
                    )}
                    Pay ₹{pricing.totalAmount.toFixed(2)} Instantly
                  </button>
                </div>
              )}

              {selectedMethod === 'upi' && (
                <div className="p-3 rounded-3 bg-dark border border-secondary border-opacity-25">
                  <label className="form-label text-secondary small fw-semibold">
                    Enter Virtual Payment Address (VPA / UPI ID)
                  </label>
                  <div className="input-group mb-3">
                    <input
                      type="text"
                      className="form-control bg-dark text-white border-secondary"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@okhdfcbank"
                      required
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-cinema-primary fw-bold"
                    >
                      {submitting ? 'Verifying...' : `Pay ₹${pricing.totalAmount.toFixed(2)}`}
                    </button>
                  </div>
                  <div className="d-flex align-items-center gap-3 text-secondary small">
                    <span className="badge bg-secondary">Google Pay</span>
                    <span className="badge bg-secondary">PhonePe</span>
                    <span className="badge bg-secondary">Paytm</span>
                    <span className="badge bg-secondary">BHIM</span>
                  </div>
                </div>
              )}

              {selectedMethod === 'card' && (
                <div className="p-3 rounded-3 bg-dark border border-secondary border-opacity-25">
                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-semibold">Card Number</label>
                    <input
                      type="text"
                      className="form-control bg-dark text-white border-secondary"
                      value={cardData.number}
                      onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label text-secondary small fw-semibold">Cardholder Name</label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        value={cardData.name}
                        onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label text-secondary small fw-semibold">Expiry</label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label text-secondary small fw-semibold">CVV</label>
                      <input
                        type="password"
                        maxLength="4"
                        className="form-control bg-dark text-white border-secondary"
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-cinema-primary w-100 py-2 fw-bold"
                  >
                    {submitting ? 'Verifying Card...' : `Pay ₹${pricing.totalAmount.toFixed(2)}`}
                  </button>
                </div>
              )}

              {selectedMethod === 'netbanking' && (
                <div className="p-3 rounded-3 bg-dark border border-secondary border-opacity-25">
                  <label className="form-label text-secondary small fw-semibold mb-2">
                    Popular Net Banking Providers
                  </label>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Bank'].map(
                      (bank) => (
                        <button
                          key={bank}
                          type="button"
                          className={`btn btn-sm ${
                            selectedBank === bank ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary'
                          }`}
                          onClick={() => setSelectedBank(bank)}
                        >
                          {bank}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-cinema-primary w-100 py-2 fw-bold"
                  >
                    {submitting ? 'Connecting...' : `Proceed with ${selectedBank} (₹${pricing.totalAmount.toFixed(2)})`}
                  </button>
                </div>
              )}
            </form>
          </div>

          <div className="p-3 rounded-3 bg-dark border border-secondary border-opacity-25 d-flex align-items-center gap-3 text-secondary small">
            <FaLock className="text-warning fs-5 flex-shrink-0" />
            <div>
              <span className="text-white fw-semibold">Refund & Cancellation Policy:</span> Tickets
              can be cancelled up to 2 hours prior to showtime for an automated full refund back to your original payment method.
            </div>
          </div>
        </div>

        {/* Right: Order Summary Sidebar */}
        <div className="col-lg-5 col-xl-4">
          <div className="cinema-card p-4 sticky-top" style={{ top: '85px' }}>
            <h2 className="h5 fw-bold text-white mb-3 d-flex align-items-center gap-2">
              <FaTicketAlt className="text-warning" /> Ticket Order
            </h2>

            {/* Movie Info */}
            <div className="d-flex gap-3 mb-3 pb-3 border-bottom border-secondary border-opacity-25">
              <img
                src={show.movie?.poster}
                alt={show.movie?.title}
                className="rounded-2"
                style={{ width: '60px', height: '85px', objectFit: 'cover' }}
              />
              <div>
                <h3 className="h6 fw-bold text-white mb-1">{show.movie?.title}</h3>
                <div className="text-secondary small mb-1">{show.theatre?.name}</div>
                <div className="text-secondary small mb-1">{show.screen}</div>
                <div className="text-warning small fw-semibold">
                  {show.showDate} at {show.startTime}
                </div>
              </div>
            </div>

            {/* Seats Badges */}
            <div className="mb-3">
              <div className="text-secondary small fw-semibold mb-2">
                Seats Reserved ({seats.length})
              </div>
              <div className="d-flex flex-wrap gap-2">
                {seats.map((s) => (
                  <span key={s.seatIdentifier} className="badge bg-secondary p-2">
                    {s.seatIdentifier} ({s.category?.toUpperCase()} • ₹{s.price})
                  </span>
                ))}
              </div>
            </div>

            {/* Bill Breakdown */}
            <div className="border-top border-secondary border-opacity-25 pt-3 mb-3">
              <div className="d-flex justify-content-between text-secondary small mb-2">
                <span>Tickets Base Amount</span>
                <span className="text-white">₹{pricing.subtotal.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between text-secondary small mb-2">
                <span>Integrated GST (18%)</span>
                <span className="text-white">₹{pricing.taxes.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between text-secondary small mb-3">
                <span>Convenience Fee</span>
                <span className="text-white">₹{pricing.convenienceFee.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between fw-bold fs-5 text-warning border-top border-secondary border-opacity-25 pt-2">
                <span>Total Payable</span>
                <span>₹{pricing.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center text-secondary small">
              <FaInfoCircle className="me-1" />
              Receipt will be sent to <strong>{user?.email}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
