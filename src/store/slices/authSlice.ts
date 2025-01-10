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
    updateUserLockStatus: (state, action: PayloadAction<{ userId: string; isLocked: boolean }>) => {
      if (state.user?.id === action.payload.userId) {
        state.user.isLocked = action.payload.isLocked;
      }
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUserLockStatus } = authSlice.actions;

// Load locked users from localStorage
const getLockedUsers = (): Record<string, boolean> => {
  const lockedUsers = localStorage.getItem('lockedUsers');
  return lockedUsers ? JSON.parse(lockedUsers) : {};
};

// Save locked users to localStorage
const saveLockedUsers = (lockedUsers: Record<string, boolean>) => {
  localStorage.setItem('lockedUsers', JSON.stringify(lockedUsers));
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

    if (!user.isActive) {
      throw new Error('Account ist deaktiviert');
    }

    // Check if user is locked in localStorage
    const lockedUsers = getLockedUsers();
    if (lockedUsers[user.id]) {
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

// Thunk for toggling user lock status
export const toggleUserLock = (userId: string, isLocked: boolean) => async (dispatch: any) => {
  const lockedUsers = getLockedUsers();
  
  if (isLocked) {
    lockedUsers[userId] = true;
  } else {
    delete lockedUsers[userId];
  }
  
  saveLockedUsers(lockedUsers);
  dispatch(updateUserLockStatus({ userId, isLocked }));
};

export default authSlice.reducer;