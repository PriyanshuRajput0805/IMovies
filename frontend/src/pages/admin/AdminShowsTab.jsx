import React, { useState, useEffect } from 'react';
import { FaPlus, FaClock, FaExclamationTriangle, FaTv, FaBan } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api.js';

export const AdminShowsTab = () => {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTheatreId, setSelectedTheatreId] = useState('');

  // Schedule Modal
  const [showModal, setShowModal] = useState(false);
  const [conflictError, setConflictError] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const [form, setForm] = useState({
    movieId: '',
    theatreId: '',
    screenId: '',
    showDate: new Date().toISOString().split('T')[0],
    startTime: '14:30',
    format: '2D',
    standardPrice: 200,
    premiumPrice: 320,
    vipPrice: 500
  });

  const fetchShows = async () => {
    setLoading(true);
    try {
      let url = `/shows?date=${selectedDate}`;
      if (selectedTheatreId) url += `&theatreId=${selectedTheatreId}`;
      const res = await api.get(url);
      setShows(res.data);
    } catch (err) {
      toast.error('Failed to load shows: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = async () => {
    try {
      const [mRes, tRes] = await Promise.all([
        api.get('/movies?status=now_showing&limit=100'),
        api.get('/theatres')
      ]);
      setMovies(mRes.data);
      setTheatres(tRes.data);
      if (tRes.data.length > 0) {
        setForm((prev) => ({ ...prev, theatreId: tRes.data[0]._id }));
        loadScreensForTheatre(tRes.data[0]._id);
      }
      if (mRes.data.length > 0) {
        setForm((prev) => ({ ...prev, movieId: mRes.data[0]._id }));
      }
    } catch (err) {
      toast.error('Error initializing form options: ' + err.message);
    }
  };

  const loadScreensForTheatre = async (theatreId) => {
    try {
      const res = await api.get(`/theatres/${theatreId}/screens`);
      setScreens(res.data);
      if (res.data.length > 0) {
        setForm((prev) => ({ ...prev, screenId: res.data[0]._id }));
      } else {
        setForm((prev) => ({ ...prev, screenId: '' }));
      }
    } catch (err) {
      toast.error('Failed to load screens: ' + err.message);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchShows();
  }, [selectedDate, selectedTheatreId]);

  const handleTheatreChange = (theatreId) => {
    setForm((prev) => ({ ...prev, theatreId }));
    loadScreensForTheatre(theatreId);
    setConflictError('');
  };

  const selectedMovieObj = movies.find((m) => m._id === form.movieId);

  // Compute live estimated end time
  const computeEstimatedEnd = () => {
    if (!selectedMovieObj || !form.startTime) return '--:--';
    const [h, m] = form.startTime.split(':').map(Number);
    const startMins = h * 60 + m;
    const endMins = startMins + selectedMovieObj.duration + 20; // 20 min turnaround
    const endH = Math.floor(endMins / 60) % 24;
    const endM = endMins % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const handleScheduleShow = async (e) => {
    e.preventDefault();
    setConflictError('');
    setScheduling(true);

    const payload = {
      movieId: form.movieId,
      theatreId: form.theatreId,
      screenId: form.screenId,
      showDate: form.showDate,
      startTime: form.startTime,
      format: form.format,
      pricing: {
        standard: Number(form.standardPrice),
        premium: Number(form.premiumPrice),
        vip: Number(form.vipPrice)
      }
    };

    try {
      await api.post('/shows', payload);
      toast.success('Show scheduled successfully with zero schedule conflicts!');
      setShowModal(false);
      fetchShows();
    } catch (err) {
      if (err.statusCode === 409) {
        setConflictError(err.message);
      } else {
        toast.error(err.message || 'Failed to schedule show');
      }
    } finally {
      setScheduling(false);
    }
  };

  const handleCancelShow = async (showId, movieTitle) => {
    if (!window.confirm(`Cancel show for '${movieTitle}'?`)) return;
    try {
      await api.delete(`/shows/${showId}`);
      toast.success('Show status updated to cancelled');
      fetchShows();
    } catch (err) {
      toast.error('Failed to cancel show: ' + err.message);
    }
  };

  return (
    <div>
      {/* Top filters row */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div className="d-flex flex-wrap align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <span className="text-secondary small">Date:</span>
            <input
              type="date"
              className="form-control form-control-sm bg-dark text-white border-secondary shadow-none"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="text-secondary small">Theatre:</span>
            <select
              className="form-select form-select-sm bg-dark text-white border-secondary shadow-none"
              style={{ maxWidth: '280px' }}
              value={selectedTheatreId}
              onChange={(e) => setSelectedTheatreId(e.target.value)}
            >
              <option value="">All Theatres</option>
              {theatres.map((t) => (
                <option key={t._id} value={t._id}>{t.name} ({t.city})</option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={() => { setShowModal(true); setConflictError(''); }} className="btn btn-cinema-primary btn-sm d-flex align-items-center gap-2">
          <FaPlus /> Schedule New Show
        </button>
      </div>

      {/* Shows Table */}
      <div className="cinema-card overflow-hidden">
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0" style={{ background: 'transparent' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--imovies-border)', color: 'var(--imovies-text-muted)' }}>
                <th>Movie</th>
                <th>Theatre & Screen</th>
                <th>Show Timing</th>
                <th>Format</th>
                <th>Pricing Tiers</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-secondary">
                    <span className="spinner-border spinner-border-sm me-2"></span> Loading show schedules...
                  </td>
                </tr>
              ) : shows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-secondary">
                    No shows scheduled for the selected date and theatre. Click "Schedule New Show" above to add one.
                  </td>
                </tr>
              ) : (
                shows.map((s) => (
                  <tr key={s._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={s.movieId?.poster}
                          alt={s.movieId?.title}
                          style={{ width: '36px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100'; }}
                        />
                        <div>
                          <span className="fw-bold text-white d-block">{s.movieId?.title}</span>
                          <span className="text-muted small">{s.movieId?.duration} mins</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-white small fw-semibold d-block">{s.theatreId?.name}</span>
                      <span className="text-secondary small d-flex align-items-center gap-1">
                        <FaTv size={10} /> {s.screenId?.name}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-gold d-flex align-items-center gap-1" style={{ width: 'fit-content' }}>
                        <FaClock size={10} /> {s.startTime} – {s.endTime}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-secondary small">{s.format}</span>
                    </td>
                    <td>
                      <div className="small">
                        <span className="text-secondary">Std: <strong className="text-light">₹{s.pricing?.standard}</strong></span> |{' '}
                        <span className="text-secondary">Prm: <strong className="text-light">₹{s.pricing?.premium}</strong></span> |{' '}
                        <span className="text-secondary">VIP: <strong className="text-light">₹{s.pricing?.vip}</strong></span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${s.status === 'scheduled' ? 'badge-emerald' : 'badge-red'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="text-end">
                      {s.status === 'scheduled' && (
                        <button
                          onClick={() => handleCancelShow(s._id, s.movieId?.title)}
                          className="btn btn-cinema-outline btn-sm py-1 px-2 text-danger"
                          title="Cancel Show"
                        >
                          <FaBan />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Show Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content cinema-card text-light" style={{ background: '#0e1422', border: '1px solid var(--imovies-primary)' }}>
              <div className="modal-header border-secondary">
                <h5 className="modal-title cinema-heading text-white">
                  Schedule New Show
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleScheduleShow}>
                <div className="modal-body">
                  {/* Conflict Alert Banner */}
                  {conflictError && (
                    <div className="alert alert-danger d-flex align-items-start gap-2 mb-3">
                      <FaExclamationTriangle size={20} className="mt-1 flex-shrink-0" />
                      <div>
                        <strong>Schedule Conflict Detected:</strong>
                        <div className="small mt-1">{conflictError}</div>
                      </div>
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small">Movie *</label>
                      <select
                        className="form-select bg-dark text-white border-secondary"
                        value={form.movieId}
                        onChange={(e) => {
                          setForm({ ...form, movieId: e.target.value });
                          setConflictError('');
                        }}
                      >
                        {movies.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.title} ({m.duration} mins) [{m.certification}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small">Screening Format</label>
                      <select
                        className="form-select bg-dark text-white border-secondary"
                        value={form.format}
                        onChange={(e) => setForm({ ...form, format: e.target.value })}
                      >
                        <option value="2D">2D</option>
                        <option value="3D">3D</option>
                        <option value="IMAX 3D">IMAX 3D</option>
                        <option value="4DX">4DX</option>
                        <option value="Dolby Atmos 2D">Dolby Atmos 2D</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small">Theatre *</label>
                      <select
                        className="form-select bg-dark text-white border-secondary"
                        value={form.theatreId}
                        onChange={(e) => handleTheatreChange(e.target.value)}
                      >
                        {theatres.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name} ({t.city})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small">Auditorium / Screen *</label>
                      <select
                        className="form-select bg-dark text-white border-secondary"
                        value={form.screenId}
                        onChange={(e) => {
                          setForm({ ...form, screenId: e.target.value });
                          setConflictError('');
                        }}
                      >
                        {screens.map((sc) => (
                          <option key={sc._id} value={sc._id}>
                            {sc.name} ({sc.screenType} - {sc.totalCapacity} seats)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small">Show Date *</label>
                      <input
                        type="date"
                        required
                        className="form-control bg-dark text-white border-secondary"
                        value={form.showDate}
                        onChange={(e) => {
                          setForm({ ...form, showDate: e.target.value });
                          setConflictError('');
                        }}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small">Start Time (24h) *</label>
                      <input
                        type="time"
                        required
                        className="form-control bg-dark text-white border-secondary"
                        value={form.startTime}
                        onChange={(e) => {
                          setForm({ ...form, startTime: e.target.value });
                          setConflictError('');
                        }}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small">Estimated End Time</label>
                      <div className="form-control bg-dark text-warning border-secondary d-flex align-items-center justify-content-between">
                        <span>{computeEstimatedEnd()}</span>
                        <small className="text-secondary">(+20m turnaround)</small>
                      </div>
                    </div>

                    {/* Tiered Ticket Pricing */}
                    <div className="col-12">
                      <h6 className="text-white small fw-bold mt-2 mb-2 border-top pt-3 border-secondary">
                        Tiered Ticket Pricing (₹ INR)
                      </h6>
                      <div className="row g-2">
                        <div className="col-4">
                          <label className="form-label text-secondary small">Standard</label>
                          <input
                            type="number"
                            min="50"
                            required
                            className="form-control bg-dark text-white border-secondary"
                            value={form.standardPrice}
                            onChange={(e) => setForm({ ...form, standardPrice: e.target.value })}
                          />
                        </div>
                        <div className="col-4">
                          <label className="form-label text-secondary small">Premium</label>
                          <input
                            type="number"
                            min="50"
                            required
                            className="form-control bg-dark text-white border-secondary"
                            value={form.premiumPrice}
                            onChange={(e) => setForm({ ...form, premiumPrice: e.target.value })}
                          />
                        </div>
                        <div className="col-4">
                          <label className="form-label text-secondary small">VIP Recliner</label>
                          <input
                            type="number"
                            min="50"
                            required
                            className="form-control bg-dark text-white border-secondary"
                            value={form.vipPrice}
                            onChange={(e) => setForm({ ...form, vipPrice: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-cinema-outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={scheduling} className="btn btn-cinema-primary">
                    {scheduling ? 'Validating Conflicts...' : 'Confirm Show Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShowsTab;
