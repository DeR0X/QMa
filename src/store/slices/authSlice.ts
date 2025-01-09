import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types';
import { users } from '../../data/mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;

// Thunk for login
export const login = (personalNumber: string, password: string) => async (dispatch: any) => {
  dispatch(loginStart());

  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = users.find(u => u.personalNumber === personalNumber);

    if (!user) {
      throw new Error('Ungültige Anmeldedaten');
    }

    if (!user.isActive) {
      throw new Error('Account ist gesperrt');
    }

    // In real app, we would verify password here
    // For demo, we'll just check if password is not empty
    if (!password) {
      throw new Error('Password wird benötigt');
    }

    dispatch(loginSuccess(user));
  } catch (error) {
    dispatch(loginFailure(error instanceof Error ? error.message : 'Login fehlgeschlagen'));
  }
};

export default authSlice.reducer;