import { createSlice } from '@reduxjs/toolkit';

// Retrieve initial user from local storage safely
const storedUser = localStorage.getItem('imovies_user');
const storedToken = localStorage.getItem('imovies_token');

let initialUser = null;
try {
  initialUser = storedUser ? JSON.parse(storedUser) : null;
} catch (e) {
  initialUser = null;
}

const initialState = {
  user: initialUser,
  token: storedToken || null,
  isAuthenticated: Boolean(storedToken && initialUser),
  role: initialUser?.role || 'guest',
  loading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    authSuccess: (state, action) => {
      const { user, token } = action.payload;
      state.loading = false;
      state.user = user;
      state.token = token;
      state.role = user.role || 'user';
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem('imovies_token', token);
      localStorage.setItem('imovies_user', JSON.stringify(user));
    },
    authFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = 'guest';
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('imovies_token');
      localStorage.removeItem('imovies_user');
    },
    updateProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('imovies_user', JSON.stringify(state.user));
    },
    clearAuthError: (state) => {
      state.error = null;
    }
  },
});

export const { authStart, authSuccess, authFailure, logout, updateProfile, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
