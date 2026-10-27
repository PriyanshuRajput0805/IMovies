import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaLock, FaHome } from 'react-icons/fa';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading session...</span>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to login
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Role restriction check
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 text-center">
            <div className="cinema-card p-5">
              <div className="p-3 rounded-circle d-inline-block mb-3" style={{ background: 'rgba(225, 29, 72, 0.15)', color: 'var(--imovies-accent)' }}>
                <FaLock size={36} />
              </div>
              <h2 className="cinema-heading text-white mb-2">403 – Access Forbidden</h2>
              <p className="text-secondary mb-4">
                You are currently signed in as a <strong>{user?.role}</strong> (<code>{user?.email}</code>). This section requires elevated <strong>{allowedRoles.join(', ')}</strong> permissions.
              </p>
              <div className="d-flex justify-content-center gap-3">
                <Link to="/" className="btn btn-cinema-primary d-inline-flex align-items-center gap-2">
                  <FaHome /> Return to Home
                </Link>
                <Link to="/profile" className="btn btn-cinema-outline">
                  My Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
