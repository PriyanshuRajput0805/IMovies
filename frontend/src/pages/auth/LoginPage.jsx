import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaFilm, FaLock, FaEnvelope, FaEye, FaEyeSlash, FaUserShield, FaUserCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { loginUser, clearAuthError } from '../../features/auth/authSlice.js';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useSelector((state) => state.auth);

  const redirectPath = new URLSearchParams(location.search).get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    const resultAction = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(resultAction)) {
      toast.success(`Welcome back, ${resultAction.payload.user.name}!`);
      navigate(redirectPath, { replace: true });
    }
  };

  const handleFillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    dispatch(clearAuthError());
    toast.info(`Filled credentials for ${demoEmail}`);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          {/* Cinema Card */}
          <div className="cinema-card p-4 p-sm-5">
            <div className="text-center mb-4">
              <div className="d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#07090e' }}>
                <FaFilm size={24} />
              </div>
              <h2 className="cinema-heading text-white mb-1">Welcome Back</h2>
              <p className="text-secondary small">Access your movie bookings and tickets</p>
            </div>

            {/* Demo Quick-Fill Buttons */}
            <div className="p-3 mb-4 rounded-3" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px dashed rgba(245, 158, 11, 0.3)' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="small text-warning fw-semibold">Quick-Fill Demo Credentials:</span>
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-cinema-outline flex-fill py-1 px-2 d-flex align-items-center justify-content-center gap-1"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => handleFillDemo('customer@imovies.com', 'Customer@123456')}
                >
                  <FaUserCheck /> Customer Demo
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-cinema-outline flex-fill py-1 px-2 d-flex align-items-center justify-content-center gap-1"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => handleFillDemo('admin@imovies.com', 'Admin@123456')}
                >
                  <FaUserShield /> Admin Demo
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="alert alert-danger py-2 px-3 small mb-3">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-secondary small mb-1" htmlFor="loginEmail">
                  Email Address
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0" style={{ borderColor: 'var(--imovies-border)', color: 'var(--imovies-text-muted)' }}>
                    <FaEnvelope size={14} />
                  </span>
                  <input
                    id="loginEmail"
                    type="email"
                    required
                    className="form-control bg-transparent text-white border-start-0 shadow-none"
                    style={{ borderColor: 'var(--imovies-border)' }}
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) dispatch(clearAuthError());
                    }}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label text-secondary small mb-1" htmlFor="loginPassword">
                  Password
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0" style={{ borderColor: 'var(--imovies-border)', color: 'var(--imovies-text-muted)' }}>
                    <FaLock size={14} />
                  </span>
                  <input
                    id="loginPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="form-control bg-transparent text-white border-start-0 border-end-0 shadow-none"
                    style={{ borderColor: 'var(--imovies-border)' }}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) dispatch(clearAuthError());
                    }}
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

              <button
                type="submit"
                disabled={loading}
                className="btn btn-cinema-primary w-100 py-2 mb-3"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Authenticating...
                  </>
                ) : (
                  'Sign In to IMovies'
                )}
              </button>

              <div className="text-center pt-2 border-top" style={{ borderColor: 'var(--imovies-border)' }}>
                <p className="text-secondary small mb-0">
                  Don't have an account yet?{' '}
                  <Link to="/register" className="text-warning text-decoration-none fw-semibold">
                    Create Account
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

export default LoginPage;
