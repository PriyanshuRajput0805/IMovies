import React, { useState, useEffect } from 'react';
import { FaPlus, FaMapMarkerAlt, FaTv, FaChair, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api.js';

export const AdminTheatresTab = () => {
  const [theatres, setTheatres] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('All');
  const [loading, setLoading] = useState(true);
  const [expandedTheatreId, setExpandedTheatreId] = useState(null);
  const [theatreScreens, setTheatreScreens] = useState({});

  // Theatre Modal
  const [showTheatreModal, setShowTheatreModal] = useState(false);
  const [theatreForm, setTheatreForm] = useState({
    name: '',
    address: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '',
    phone: '',
    amenities: 'Dolby Atmos, 4K Laser Projection, Recliner Seats, Parking, Wheelchair Accessible'
  });

  // Screen Modal
  const [showScreenModal, setShowScreenModal] = useState(false);
  const [targetTheatre, setTargetTheatre] = useState(null);
  const [screenForm, setScreenForm] = useState({
    name: 'Screen 1 - Laser IMAX',
    screenType: 'Laser IMAX',
    supportedFormats: '2D, 3D, IMAX 3D',
    rowsCount: 8,
    seatsPerRow: 12
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [theatreRes, cityRes] = await Promise.all([
        api.get(`/theatres?city=${selectedCity}`),
        api.get('/theatres/cities')
      ]);
      setTheatres(theatreRes.data);
      setCities(cityRes.data);
    } catch (err) {
      toast.error('Failed to load theatres: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCity]);

  const toggleExpandTheatre = async (theatreId) => {
    if (expandedTheatreId === theatreId) {
      setExpandedTheatreId(null);
    } else {
      setExpandedTheatreId(theatreId);
      if (!theatreScreens[theatreId]) {
        try {
          const res = await api.get(`/theatres/${theatreId}/screens`);
          setTheatreScreens((prev) => ({ ...prev, [theatreId]: res.data }));
        } catch (err) {
          toast.error('Failed to load screens: ' + err.message);
        }
      }
    }
  };

  const handleSaveTheatre = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...theatreForm,
        amenities: theatreForm.amenities.split(',').map((s) => s.trim()).filter(Boolean)
      };
      await api.post('/theatres', payload);
      toast.success(`Theatre '${payload.name}' added successfully!`);
      setShowTheatreModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to create theatre');
    }
  };

  const handleOpenAddScreen = (theatre) => {
    setTargetTheatre(theatre);
    setShowScreenModal(true);
  };

  const handleSaveScreen = async (e) => {
    e.preventDefault();
    try {
      // Generate default seating layout rows
      const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
      const rows = [];
      const count = Math.min(Number(screenForm.rowsCount), rowLabels.length);

      for (let i = 0; i < count; i++) {
        const category = i < 2 ? 'vip' : i < 5 ? 'premium' : 'standard';
        rows.push({
          rowLabel: rowLabels[i],
          category,
          seatsCount: Number(screenForm.seatsPerRow),
          accessibleSeats: i === 0 ? [1, 2] : []
        });
      }

      const payload = {
        name: screenForm.name,
        screenType: screenForm.screenType,
        supportedFormats: screenForm.supportedFormats.split(',').map((s) => s.trim()),
        seatingLayout: { rows }
      };

      await api.post(`/theatres/${targetTheatre._id}/screens`, payload);
      toast.success(`Screen added to ${targetTheatre.name}`);
      setShowScreenModal(false);

      // Refresh screens
      const res = await api.get(`/theatres/${targetTheatre._id}/screens`);
      setTheatreScreens((prev) => ({ ...prev, [targetTheatre._id]: res.data }));
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to add screen');
    }
  };

  return (
    <div>
      {/* Top action row */}
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-2">
          <span className="text-secondary small">City:</span>
          <select
            className="form-select form-select-sm bg-dark text-white border-secondary shadow-none"
            style={{ width: 'auto' }}
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="All">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button onClick={() => setShowTheatreModal(true)} className="btn btn-cinema-primary btn-sm d-flex align-items-center gap-2">
          <FaPlus /> Add New Theatre
        </button>
      </div>

      {/* Theatres List */}
      {loading ? (
        <div className="text-center py-5 text-secondary">
          <span className="spinner-border spinner-border-sm me-2"></span> Loading theatres...
        </div>
      ) : theatres.length === 0 ? (
        <div className="cinema-card p-5 text-center text-secondary">
          No theatres found in {selectedCity}.
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {theatres.map((t) => (
            <div key={t._id} className="cinema-card p-4">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h5 className="cinema-heading text-white m-0">{t.name}</h5>
                    <span className="badge badge-gold">{t.city}</span>
                  </div>
                  <p className="text-secondary small m-0 d-flex align-items-center gap-1">
                    <FaMapMarkerAlt size={12} style={{ color: 'var(--imovies-primary)' }} />
                    {t.address}, {t.state}
                  </p>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-secondary">{t.screensCount || 0} Screens</span>
                  <button
                    onClick={() => handleOpenAddScreen(t)}
                    className="btn btn-cinema-outline btn-sm d-flex align-items-center gap-1"
                  >
                    <FaPlus size={10} /> Add Screen
                  </button>
                  <button
                    onClick={() => toggleExpandTheatre(t._id)}
                    className="btn btn-cinema-outline btn-sm d-flex align-items-center gap-1"
                  >
                    <span>{expandedTheatreId === t._id ? 'Hide' : 'View'} Screens</span>
                    {expandedTheatreId === t._id ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                  </button>
                </div>
              </div>

              {/* Amenities pill tags */}
              <div className="d-flex flex-wrap gap-2 pt-2 border-top" style={{ borderColor: 'var(--imovies-border)' }}>
                {t.amenities?.map((a) => (
                  <span key={a} className="badge bg-dark text-muted" style={{ border: '1px solid var(--imovies-border)', fontSize: '0.7rem' }}>
                    {a}
                  </span>
                ))}
              </div>

              {/* Expanded Screens Section */}
              {expandedTheatreId === t._id && (
                <div className="mt-3 p-3 rounded-3" style={{ background: '#0a0d14', border: '1px solid var(--imovies-border)' }}>
                  <h6 className="cinema-heading text-warning mb-3 d-flex align-items-center gap-2">
                    <FaTv /> Auditoriums & Seating Tiers ({t.name})
                  </h6>

                  {theatreScreens[t._id]?.length === 0 ? (
                    <p className="text-secondary small m-0">No screens configured for this theatre yet.</p>
                  ) : (
                    <div className="row g-3">
                      {theatreScreens[t._id]?.map((sc) => (
                        <div key={sc._id} className="col-12 col-md-6">
                          <div className="p-3 rounded-2" style={{ background: 'var(--imovies-bg-card)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <span className="fw-bold text-white">{sc.name}</span>
                              <span className="badge badge-emerald">{sc.screenType}</span>
                            </div>
                            <div className="d-flex align-items-center justify-content-between text-secondary small mb-2">
                              <span>Total Capacity:</span>
                              <span className="text-white fw-bold d-flex align-items-center gap-1">
                                <FaChair style={{ color: 'var(--imovies-primary)' }} /> {sc.totalCapacity} Seats
                              </span>
                            </div>
                            <div className="d-flex align-items-center justify-content-between text-secondary small">
                              <span>Formats:</span>
                              <span className="text-light">{sc.supportedFormats?.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Theatre Modal */}
      {showTheatreModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content cinema-card text-light" style={{ background: '#0e1422', border: '1px solid var(--imovies-primary)' }}>
              <div className="modal-header border-secondary">
                <h5 className="modal-title cinema-heading text-white">Add New Cinema Theatre</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowTheatreModal(false)}></button>
              </div>
              <form onSubmit={handleSaveTheatre}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label text-secondary small">Theatre Name *</label>
                    <input
                      type="text"
                      required
                      className="form-control bg-dark text-white border-secondary"
                      placeholder="e.g. IMovies PVR IMAX Phoenix Palladium"
                      value={theatreForm.name}
                      onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-secondary small">City *</label>
                    <input
                      type="text"
                      required
                      className="form-control bg-dark text-white border-secondary"
                      value={theatreForm.city}
                      onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-secondary small">Address *</label>
                    <textarea
                      required
                      rows="2"
                      className="form-control bg-dark text-white border-secondary"
                      value={theatreForm.address}
                      onChange={(e) => setTheatreForm({ ...theatreForm, address: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-secondary small">Amenities (comma separated)</label>
                    <input
                      type="text"
                      className="form-control bg-dark text-white border-secondary"
                      value={theatreForm.amenities}
                      onChange={(e) => setTheatreForm({ ...theatreForm, amenities: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-cinema-outline" onClick={() => setShowTheatreModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-cinema-primary">
                    Create Theatre
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Screen Modal */}
      {showScreenModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="modal-dialog modal-md modal-dialog-centered">
            <div className="modal-content cinema-card text-light" style={{ background: '#0e1422', border: '1px solid var(--imovies-primary)' }}>
              <div className="modal-header border-secondary">
                <h5 className="modal-title cinema-heading text-white">
                  Add Screen ({targetTheatre?.name})
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowScreenModal(false)}></button>
              </div>
              <form onSubmit={handleSaveScreen}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label text-secondary small">Screen Name *</label>
                    <input
                      type="text"
                      required
                      className="form-control bg-dark text-white border-secondary"
                      value={screenForm.name}
                      onChange={(e) => setScreenForm({ ...screenForm, name: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-secondary small">Screen Technology</label>
                    <select
                      className="form-select bg-dark text-white border-secondary"
                      value={screenForm.screenType}
                      onChange={(e) => setScreenForm({ ...screenForm, screenType: e.target.value })}
                    >
                      <option value="Laser IMAX">Laser IMAX</option>
                      <option value="Dolby Cinema">Dolby Cinema</option>
                      <option value="4DX">4DX</option>
                      <option value="Standard">Standard Auditorium</option>
                      <option value="Gold Class">Gold Class Lounge</option>
                    </select>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label text-secondary small">Seating Rows (A-H)</label>
                      <input
                        type="number"
                        min="2"
                        max="12"
                        required
                        className="form-control bg-dark text-white border-secondary"
                        value={screenForm.rowsCount}
                        onChange={(e) => setScreenForm({ ...screenForm, rowsCount: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-secondary small">Seats Per Row</label>
                      <input
                        type="number"
                        min="4"
                        max="24"
                        required
                        className="form-control bg-dark text-white border-secondary"
                        value={screenForm.seatsPerRow}
                        onChange={(e) => setScreenForm({ ...screenForm, seatsPerRow: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="p-3 rounded-2 text-secondary small" style={{ background: '#070a10', border: '1px dashed var(--imovies-border)' }}>
                    Total Capacity Preview: <strong className="text-warning">{screenForm.rowsCount * screenForm.seatsPerRow} seats</strong> (Tiered: Rows A-B VIP, C-E Premium, F+ Standard)
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-cinema-outline" onClick={() => setShowScreenModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-cinema-primary">
                    Create Screen
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

export default AdminTheatresTab;
