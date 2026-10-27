import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaArchive, FaStar, FaFilm, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api.js';

export const AdminMoviesTab = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const initialForm = {
    title: '',
    description: '',
    poster: '',
    backdrop: '',
    genres: 'Action, Sci-Fi',
    languages: 'English, Hindi',
    formats: '2D, 3D, IMAX 3D',
    duration: 150,
    director: '',
    cast: '',
    releaseDate: new Date().toISOString().split('T')[0],
    certification: 'UA',
    trailerUrl: '',
    status: 'now_showing',
    rating: 8.5
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/movies?status=${statusFilter}&limit=100`);
      setMovies(res.data);
    } catch (err) {
      toast.error('Failed to load movies: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [statusFilter]);

  const handleOpenAdd = () => {
    setEditingMovie(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const handleOpenEdit = (movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      description: movie.description,
      poster: movie.poster,
      backdrop: movie.backdrop || '',
      genres: movie.genres.join(', '),
      languages: movie.languages.join(', '),
      formats: movie.formats.join(', '),
      duration: movie.duration,
      director: movie.director || '',
      cast: movie.cast?.join(', ') || '',
      releaseDate: movie.releaseDate ? movie.releaseDate.split('T')[0] : '',
      certification: movie.certification || 'UA',
      trailerUrl: movie.trailerUrl || '',
      status: movie.status,
      rating: movie.rating || 8.0
    });
    setShowModal(true);
  };

  const handleSaveMovie = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...formData,
      genres: formData.genres.split(',').map((s) => s.trim()).filter(Boolean),
      languages: formData.languages.split(',').map((s) => s.trim()).filter(Boolean),
      formats: formData.formats.split(',').map((s) => s.trim()).filter(Boolean),
      cast: formData.cast.split(',').map((s) => s.trim()).filter(Boolean),
      duration: Number(formData.duration),
      rating: Number(formData.rating)
    };

    try {
      if (editingMovie) {
        await api.patch(`/movies/${editingMovie._id}`, payload);
        toast.success(`Movie '${payload.title}' updated successfully`);
      } else {
        await api.post('/movies', payload);
        toast.success(`Movie '${payload.title}' added to catalogue`);
      }
      setShowModal(false);
      fetchMovies();
    } catch (err) {
      toast.error(err.message || 'Failed to save movie');
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveMovie = async (movieId, movieTitle) => {
    if (!window.confirm(`Are you sure you want to archive '${movieTitle}'?`)) return;
    try {
      await api.delete(`/movies/${movieId}`);
      toast.success(`Movie '${movieTitle}' archived`);
      fetchMovies();
    } catch (err) {
      toast.error('Failed to archive: ' + err.message);
    }
  };

  return (
    <div>
      {/* Top action row */}
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 mb-4">
        <div className="d-flex align-items-center gap-2">
          <span className="text-secondary small">Filter:</span>
          {['all', 'now_showing', 'upcoming', 'archived'].map((status) => (
            <button
              key={status}
              className={`btn btn-sm ${statusFilter === status ? 'btn-cinema-primary' : 'btn-cinema-outline'} text-capitalize`}
              onClick={() => setStatusFilter(status)}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        <button onClick={handleOpenAdd} className="btn btn-cinema-primary btn-sm d-flex align-items-center gap-2">
          <FaPlus /> Add New Movie
        </button>
      </div>

      {/* Movies Table */}
      <div className="cinema-card overflow-hidden">
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0" style={{ background: 'transparent' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--imovies-border)', color: 'var(--imovies-text-muted)' }}>
                <th>Movie</th>
                <th>Genres & Duration</th>
                <th>Formats</th>
                <th>Rating</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-secondary">
                    <span className="spinner-border spinner-border-sm me-2"></span> Loading catalogue...
                  </td>
                </tr>
              ) : movies.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-secondary">
                    No movies found matching current filter.
                  </td>
                </tr>
              ) : (
                movies.map((m) => (
                  <tr key={m._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={m.poster}
                          alt={m.title}
                          style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '6px' }}
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200'; }}
                        />
                        <div>
                          <span className="fw-bold text-white d-block">{m.title}</span>
                          <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>{m.certification}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-secondary small d-block">{m.genres?.join(', ')}</span>
                      <span className="text-muted small d-flex align-items-center gap-1">
                        <FaClock size={10} /> {m.duration} mins
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-secondary small">{m.formats?.join(', ')}</span>
                    </td>
                    <td>
                      <span className="text-warning small fw-bold d-flex align-items-center gap-1">
                        <FaStar /> {m.rating || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${m.status === 'now_showing' ? 'badge-emerald' : m.status === 'upcoming' ? 'badge-gold' : 'badge-red'}`}>
                        {m.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button onClick={() => handleOpenEdit(m)} className="btn btn-cinema-outline py-1 px-2" title="Edit Movie">
                          <FaEdit />
                        </button>
                        {m.status !== 'archived' && (
                          <button onClick={() => handleArchiveMovie(m._id, m.title)} className="btn btn-cinema-outline py-1 px-2 text-danger" title="Archive Movie">
                            <FaArchive />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content cinema-card text-light" style={{ background: '#0e1422', border: '1px solid var(--imovies-primary)' }}>
              <div className="modal-header border-secondary">
                <h5 className="modal-title cinema-heading text-white">
                  {editingMovie ? `Edit Movie: ${editingMovie.title}` : 'Add New Movie to Catalogue'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSaveMovie}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12 col-md-8">
                      <label className="form-label text-secondary small">Movie Title *</label>
                      <input
                        type="text"
                        required
                        className="form-control bg-dark text-white border-secondary"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small">Certification</label>
                      <select
                        className="form-select bg-dark text-white border-secondary"
                        value={formData.certification}
                        onChange={(e) => setFormData({ ...formData, certification: e.target.value })}
                      >
                        <option value="U">U (Universal)</option>
                        <option value="UA">UA (Parental Guidance)</option>
                        <option value="A">A (Adults Only)</option>
                        <option value="PG-13">PG-13</option>
                        <option value="R">R</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label text-secondary small">Synopsis / Description *</label>
                      <textarea
                        required
                        rows="3"
                        className="form-control bg-dark text-white border-secondary"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small">Poster Image URL *</label>
                      <input
                        type="url"
                        required
                        className="form-control bg-dark text-white border-secondary"
                        placeholder="https://images.unsplash.com/..."
                        value={formData.poster}
                        onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small">Backdrop Banner URL</label>
                      <input
                        type="url"
                        className="form-control bg-dark text-white border-secondary"
                        placeholder="https://images.unsplash.com/..."
                        value={formData.backdrop}
                        onChange={(e) => setFormData({ ...formData, backdrop: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small">Genres (comma separated) *</label>
                      <input
                        type="text"
                        required
                        className="form-control bg-dark text-white border-secondary"
                        value={formData.genres}
                        onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small">Languages (comma separated) *</label>
                      <input
                        type="text"
                        required
                        className="form-control bg-dark text-white border-secondary"
                        value={formData.languages}
                        onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small">Formats (comma separated) *</label>
                      <input
                        type="text"
                        required
                        className="form-control bg-dark text-white border-secondary"
                        value={formData.formats}
                        onChange={(e) => setFormData({ ...formData, formats: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small">Duration (minutes) *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        className="form-control bg-dark text-white border-secondary"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small">Release Date *</label>
                      <input
                        type="date"
                        required
                        className="form-control bg-dark text-white border-secondary"
                        value={formData.releaseDate}
                        onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label text-secondary small">Catalogue Status</label>
                      <select
                        className="form-select bg-dark text-white border-secondary"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="now_showing">Now Showing</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small">Director</label>
                      <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        value={formData.director}
                        onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-secondary small">Trailer Embed URL</label>
                      <input
                        type="url"
                        className="form-control bg-dark text-white border-secondary"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={formData.trailerUrl}
                        onChange={(e) => setFormData({ ...formData, trailerUrl: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-secondary">
                  <button type="button" className="btn btn-cinema-outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-cinema-primary">
                    {saving ? 'Saving...' : editingMovie ? 'Save Changes' : 'Create Movie'}
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

export default AdminMoviesTab;
