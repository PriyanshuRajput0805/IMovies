import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './components/common/Header.jsx';
import Footer from './components/common/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
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
          <Route path="/" element={<HomePage onStatusChange={setBackendConnected} />} />
          <Route
            path="*"
            element={
              <div className="container py-5 text-center">
                <h2 className="cinema-heading text-warning mb-3">Page Under Construction</h2>
                <p className="text-secondary mb-4">This route will be unlocked in upcoming implementation phases.</p>
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
