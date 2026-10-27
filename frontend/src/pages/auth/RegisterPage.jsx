import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaFilm, FaUser, FaEnvelope, FaLock, FaPhone, FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { registerUser, clearAuthError } from '../../features/auth/authSlice.js';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setValidationError('');
    if (error) dispatch(clearAuthError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setValidationError('Please complete all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      password: formData.password,
    };

    const resultAction = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(resultAction)) {
      toast.success(`Account created successfully! Welcome to IMovies, ${resultAction.payload.user.name}.`);
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="cinema-card p-4 p-sm-5">
            <div className="text-center mb-4">
              <div className="d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#07090e' }}>
                <FaFilm size={24} />
              </div>
              <h2 className="cinema-heading text-white mb-1">Create Account</h2>
              <p className="text-secondary small">Join IMovies for seamless movie bookings and digital tickets</p>
            </div>

            {/* Error alerts */}
            {(validationError || error) && (
              <div className="alert alert-danger py-2 px-3 small mb-3">
                {validationError || error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-secondary small mb-1" htmlFor="regName">
                  Full Name <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0" style={{ borderColor: 'var(--imovies-border)', color: 'var(--imovies-text-muted)' }}>
                    <FaUser size={14} />
                  </span>
                  <input
                    id="regName"
                    name="name"
                    type="text"
                    required
                    className="form-control bg-transparent text-white border-start-0 shadow-none"
                    style={{ borderColor: 'var(--imovies-border)' }}
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small mb-1" htmlFor="regEmail">
                  Email Address <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0" style={{ borderColor: 'var(--imovies-border)', color: 'var(--imovies-text-muted)' }}>
                    <FaEnvelope size={14} />
                  </span>
                  <input
                    id="regEmail"
                    name="email"
                    type="email"
                    required
                    className="form-control bg-transparent text-white border-start-0 shadow-none"
                    style={{ borderColor: 'var(--imovies-border)' }}
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small mb-1" htmlFor="regPhone">
                  Phone Number (Optional)
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0" style={{ borderColor: 'var(--imovies-border)', color: 'var(--imovies-text-muted)' }}>
                    <FaPhone size={14} />
                  </span>
                  <input
                    id="regPhone"
                    name="phone"
                    type="tel"
                    className="form-control bg-transparent text-white border-start-0 shadow-none"
                    style={{ borderColor: 'var(--imovies-border)' }}
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="row g-2 mb-4">
                <div className="col-12 col-sm-6">
                  <label className="form-label text-secondary small mb-1" htmlFor="regPassword">
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-transparent border-end-0" style={{ borderColor: 'var(--imovies-border)', color: 'var(--imovies-text-muted)' }}>
                      <FaLock size={14} />
                    </span>
                    <input
                      id="regPassword"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="form-control bg-transparent text-white border-start-0 border-end-0 shadow-none"
                      style={{ borderColor: 'var(--imovies-border)' }}
                      placeholder="Min. 6 chars"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="input-group-text bg-transparent border-start-0"
                      style={{ borderColor: 'var(--imovies-border)', color: 'var(--imovies-text-muted)' }}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="col-12 col-sm-6">
                  <label className="form-label text-secondary small mb-1" htmlFor="regConfirmPassword">
                    Confirm Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-transparent border-end-0" style={{ borderColor: 'var(--imovies-border)', color: 'var(--imovies-text-muted)' }}>
                      <FaLock size={14} />
                    </span>
                    <input
                      id="regConfirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="form-control bg-transparent text-white border-start-0 shadow-none"
                      style={{ borderColor: 'var(--imovies-border)' }}
                      placeholder="Repeat password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-cinema-primary w-100 py-2 mb-3"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating Account...
                  </>
                ) : (
                  'Create IMovies Account'
                )}
              </button>

              <div className="text-center pt-2 border-top" style={{ borderColor: 'var(--imovies-border)' }}>
                <p className="text-secondary small mb-0">
                  Already registered?{' '}
                  <Link to="/login" className="text-warning text-decoration-none fw-semibold">
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
