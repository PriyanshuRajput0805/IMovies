import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/common/Header.jsx';
import Footer from './components/common/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import MovieDiscoveryPage from './pages/movies/MovieDiscoveryPage.jsx';
import MovieDetailsPage from './pages/movies/MovieDetailsPage.jsx';
import TheatresPage from './pages/theatres/TheatresPage.jsx';
import TheatreDetailsPage from './pages/theatres/TheatreDetailsPage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import ProfilePage from './pages/profile/ProfilePage.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import { socketService } from './services/socket.js';

export function App() {
  const [backendConnected, setBackendConnected] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    // Initialize Socket.IO connection
    const socket = socketService.connect();

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (socket.connected) {
      setSocketConnected(true);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100 bg-dark text-light">
      <Header backendConnected={backendConnected} socketConnected={socketConnected} />

      <main className="flex-grow-1">
        <Routes>
          {/* Public Customer Routes */}
          <Route path="/" element={<HomePage onStatusChange={setBackendConnected} />} />
          <Route path="/movies" element={<MovieDiscoveryPage />} />
          <Route path="/movies/:id" element={<MovieDetailsPage />} />
          <Route path="/theatres" element={<TheatresPage />} />
          <Route path="/theatres/:id" element={<TheatreDetailsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Customer Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Protected Administrator Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback 404 Route */}
          <Route
            path="*"
            element={
              <div className="container py-5 text-center">
                <h2 className="cinema-heading text-warning mb-3">404 – Page Not Found</h2>
                <p className="text-secondary mb-4">The cinema page or screening you requested does not exist.</p>
                <a href="/" className="btn btn-cinema-primary">Return to Homepage</a>
              </div>
            }
          />
        </Routes>
      </main>

      <Footer />

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}

export default App;
