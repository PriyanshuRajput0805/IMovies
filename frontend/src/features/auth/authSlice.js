import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api.js';

// Retrieve stored session
const storedToken = localStorage.getItem('imovies_token');
let storedUser = null;
try {
  storedUser = JSON.parse(localStorage.getItem('imovies_user'));
} catch (e) {
  storedUser = null;
}

const initialState = {
  user: storedUser,
  token: storedToken || null,
  isAuthenticated: Boolean(storedToken && storedUser),
  role: storedUser?.role || 'guest',
  loading: false,
  error: null,
};

// Async Thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data; // { user, accessToken, refreshToken }
    } catch (err) {
      return rejectWithValue(err.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data; // { user, accessToken, refreshToken }
    } catch (err) {
      return rejectWithValue(err.message || 'Registration failed');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      return response.data.user;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch user profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.patch('/auth/profile', profileData);
      return response.data.user;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to update profile');
    }
  }
);

export const changeUserPassword = createAsyncThunk(
  'auth/changeUserPassword',
  async (passwords, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/change-password', passwords);
      return response.message;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to change password');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { dispatch }) => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // ignore logout network errors
    } finally {
      dispatch(authSlice.actions.clearSession());
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    clearSession: (state) => {
      state.user = null;
      state.token = null;
      state.role = 'guest';
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('imovies_token');
      localStorage.removeItem('imovies_user');
    }
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.role = action.payload.user.role;
        state.isAuthenticated = true;
        state.error = null;
        localStorage.setItem('imovies_token', action.payload.accessToken);
        localStorage.setItem('imovies_user', JSON.stringify(action.payload.user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.role = action.payload.user.role;
        state.isAuthenticated = true;
        state.error = null;
        localStorage.setItem('imovies_token', action.payload.accessToken);
        localStorage.setItem('imovies_user', JSON.stringify(action.payload.user));
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Current User
    builder
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.role = action.payload.role;
        localStorage.setItem('imovies_user', JSON.stringify(action.payload));
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        // Token might be invalid/expired
        state.user = null;
        state.token = null;
        state.role = 'guest';
        state.isAuthenticated = false;
        localStorage.removeItem('imovies_token');
        localStorage.removeItem('imovies_user');
      });

    // Update Profile
    builder
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem('imovies_user', JSON.stringify(action.payload));
      });
  }
});

export const { clearAuthError, clearSession } = authSlice.actions;
export default authSlice.reducer;
