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
    updateUserActiveStatus: (state, action: PayloadAction<{ userId: string; isActive: boolean }>) => {
      if (state.user?.id === action.payload.userId) {
        state.user.isActive = action.payload.isActive;
      }
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUserActiveStatus } = authSlice.actions;

export const hasHRPermissions = (user: User | null) => {
  return user?.role === 'hr';
};

export const canManageEmployees = (user: User | null) => {
  return user?.role === 'hr' || user?.role === 'supervisor';
};

export const canAccessAnalytics = (user: User | null) => {
  return user?.role === 'hr';
};

// Load inactive users from localStorage
const getInactiveUsers = (): Record<string, boolean> => {
  const inactiveUsers = localStorage.getItem('inactiveUsers');
  return inactiveUsers ? JSON.parse(inactiveUsers) : {};
};

// Save inactive users to localStorage
const saveInactiveUsers = (inactiveUsers: Record<string, boolean>) => {
  localStorage.setItem('inactiveUsers', JSON.stringify(inactiveUsers));
};

// Thunk for login
export const login = (personalNumber: string, password: string) => async (dispatch: any) => {
  dispatch(loginStart());

  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = users.find(u => u.personalNumber === personalNumber);

    if (!user) {
      throw new Error('Ungültige Anmeldedaten');
    }

    // Check if user is inactive in localStorage
    const inactiveUsers = getInactiveUsers();
    if (inactiveUsers[user.id] || !user.isActive) {
      throw new Error(
        'Ihr Account wurde gesperrt. Bitte kontaktieren Sie Ihren Vorgesetzten oder die IT-Abteilung für Unterstützung.'
      );
    }

    if (!password) {
      throw new Error('Password wird benötigt');
    }

    dispatch(loginSuccess(user));
  } catch (error) {
    dispatch(loginFailure(error instanceof Error ? error.message : 'Login fehlgeschlagen'));
  }
};

// Thunk for toggling user active status
export const toggleUserActive = (userId: string, isActive: boolean) => async (dispatch: any) => {
  const inactiveUsers = getInactiveUsers();
  
  if (!isActive) {
    inactiveUsers[userId] = true;
  } else {
    delete inactiveUsers[userId];
  }
  
  saveInactiveUsers(inactiveUsers);
  dispatch(updateUserActiveStatus({ userId, isActive }));
};

export default authSlice.reducer;