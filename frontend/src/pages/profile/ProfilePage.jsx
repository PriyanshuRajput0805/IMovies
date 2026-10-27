import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaUserCircle, FaShieldAlt, FaKey, FaSave, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { updateUserProfile, changeUserPassword } from '../../features/auth/authSlice.js';

export const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Tab state
  const [activeTab, setActiveTab] = useState('details');

  // Profile details state
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Full name is required');
      return;
    }

    setProfileSaving(true);
    const result = await dispatch(updateUserProfile({ name: name.trim(), phone: phone.trim() }));
    setProfileSaving(false);

    if (updateUserProfile.fulfilled.match(result)) {
      toast.success('Profile updated successfully!');
    } else {
      toast.error(result.payload || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      toast.error('Please enter current and new passwords');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setPasswordSaving(true);
    const result = await dispatch(changeUserPassword({ currentPassword, newPassword }));
    setPasswordSaving(false);

    if (changeUserPassword.fulfilled.match(result)) {
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      toast.error(result.payload || 'Failed to change password');
    }
  };

  return (
    <div className="container py-5">
      <div className="row g-4">
        {/* Left Column: User Summary Card */}
        <div className="col-12 col-md-4">
          <div className="cinema-card p-4 text-center">
            <div className="d-inline-block position-relative mb-3">
              <FaUserCircle size={80} style={{ color: 'var(--imovies-primary)' }} />
              <span className={`position-absolute bottom-0 end-0 badge rounded-pill ${user?.role === 'admin' ? 'badge-gold' : 'badge-emerald'}`}>
                {user?.role === 'admin' ? 'Admin' : 'Customer'}
              </span>
            </div>

            <h4 className="cinema-heading text-white mb-1">{user?.name}</h4>
            <p className="text-secondary small mb-3">{user?.email}</p>

            <div className="p-3 rounded-3 text-start mb-3" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--imovies-border)' }}>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-secondary small">Account Status</span>
                <span className="text-success small fw-semibold d-flex align-items-center gap-1">
                  <FaCheckCircle size={12} /> Active
                </span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-secondary small">Role</span>
                <span className="text-white small fw-bold text-capitalize">{user?.role}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-secondary small">Member Since</span>
                <span className="text-white small">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
                </span>
              </div>
            </div>

            <div className="nav flex-column nav-pills gap-2 text-start">
              <button
                className={`btn text-start d-flex align-items-center gap-2 py-2 px-3 ${activeTab === 'details' ? 'btn-cinema-primary' : 'btn-cinema-outline'}`}
                onClick={() => setActiveTab('details')}
              >
                <FaShieldAlt /> Personal Information
              </button>
              <button
                className={`btn text-start d-flex align-items-center gap-2 py-2 px-3 ${activeTab === 'password' ? 'btn-cinema-primary' : 'btn-cinema-outline'}`}
                onClick={() => setActiveTab('password')}
              >
                <FaKey /> Security & Password
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Tab Content */}
        <div className="col-12 col-md-8">
          <div className="cinema-card p-4 p-md-5">
            {activeTab === 'details' && (
              <div>
                <div className="border-bottom pb-3 mb-4" style={{ borderColor: 'var(--imovies-border)' }}>
                  <h4 className="cinema-heading text-white mb-1">Personal Information</h4>
                  <p className="text-secondary small m-0">Update your account name and phone number.</p>
                </div>

                <form onSubmit={handleUpdateProfile}>
                  <div className="mb-3">
                    <label className="form-label text-secondary small mb-1" htmlFor="profileEmail">
                      Email Address (Read-only)
                    </label>
                    <input
                      id="profileEmail"
                      type="email"
                      disabled
                      className="form-control bg-dark text-muted border-secondary shadow-none"
                      value={user?.email || ''}
                    />
                    <small className="text-muted">Email address cannot be modified once registered.</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-secondary small mb-1" htmlFor="profileName">
                      Full Name
                    </label>
                    <input
                      id="profileName"
                      type="text"
                      required
                      className="form-control bg-transparent text-white shadow-none"
                      style={{ borderColor: 'var(--imovies-border)' }}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-secondary small mb-1" htmlFor="profilePhone">
                      Phone Number
                    </label>
                    <input
                      id="profilePhone"
                      type="tel"
                      className="form-control bg-transparent text-white shadow-none"
                      style={{ borderColor: 'var(--imovies-border)' }}
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="btn btn-cinema-primary d-inline-flex align-items-center gap-2 px-4"
                  >
                    <FaSave />
                    <span>{profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'password' && (
              <div>
                <div className="border-bottom pb-3 mb-4" style={{ borderColor: 'var(--imovies-border)' }}>
                  <h4 className="cinema-heading text-white mb-1">Change Account Password</h4>
                  <p className="text-secondary small m-0">Protect your account with a strong, distinct password.</p>
                </div>

                <form onSubmit={handleChangePassword}>
                  <div className="mb-3">
                    <label className="form-label text-secondary small mb-1" htmlFor="currentPassword">
                      Current Password
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      required
                      className="form-control bg-transparent text-white shadow-none"
                      style={{ borderColor: 'var(--imovies-border)' }}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-secondary small mb-1" htmlFor="newPassword">
                      New Password
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      required
                      className="form-control bg-transparent text-white shadow-none"
                      style={{ borderColor: 'var(--imovies-border)' }}
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-secondary small mb-1" htmlFor="confirmNewPassword">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmNewPassword"
                      type="password"
                      required
                      className="form-control bg-transparent text-white shadow-none"
                      style={{ borderColor: 'var(--imovies-border)' }}
                      placeholder="Repeat new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="btn btn-cinema-primary d-inline-flex align-items-center gap-2 px-4"
                  >
                    <FaKey />
                    <span>{passwordSaving ? 'Updating Password...' : 'Update Password'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
