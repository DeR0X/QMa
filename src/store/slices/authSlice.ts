import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Employee } from '../../types';
import { employees } from '../../data/mockData';

interface AuthState {
  employee: Employee | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  sessionExpiry: number | null;
}

// Load initial state from localStorage
const loadInitialState = (): AuthState => {
  const savedAuth = localStorage.getItem('auth');
  if (savedAuth) {
    const parsed = JSON.parse(savedAuth);
    // Check if session is still valid
    if (parsed.sessionExpiry && parsed.sessionExpiry > Date.now()) {
      return parsed;
    }
  }
  return {
    employee: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    sessionExpiry: null,
  };
};

const initialState: AuthState = loadInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<Employee>) => {
      state.employee = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      // Set session expiry to 30 minutes from now
      state.sessionExpiry = Date.now() + 30 * 60 * 1000;
      // Save to localStorage
      localStorage.setItem('auth', JSON.stringify(state));
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.employee = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.sessionExpiry = null;
      // Clear localStorage
      localStorage.removeItem('auth');
    },
    updateUserActiveStatus: (state, action: PayloadAction<{ userId: string; isActive: boolean }>) => {
      if (state.employee?.id === action.payload.userId) {
        state.employee.isActive = action.payload.isActive;
        if (state.isAuthenticated) {
          localStorage.setItem('auth', JSON.stringify(state));
        }
      }
    },
    refreshSession: (state) => {
      if (state.isAuthenticated) {
        state.sessionExpiry = Date.now() + 30 * 60 * 1000;
        localStorage.setItem('auth', JSON.stringify(state));
      }
    },
  },
});

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  updateUserActiveStatus,
  refreshSession 
} = authSlice.actions;

export const hasHRPermissions = (employee: Employee | null) => {
  return employee?.role === 'hr';
};

export const canManageEmployees = (employee: Employee | null) => {
  return employee?.role === 'hr' || employee?.role === 'supervisor';
};

export const canAccessAnalytics = (employee: Employee | null) => {
  return employee?.role === 'hr';
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
export const login = (staffNumber: string, password: string) => async (dispatch: any) => {
  dispatch(loginStart());

  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const employee = employees.find(e => e.staffNumber === staffNumber);

    if (!employee) {
      throw new Error('Ungültige Anmeldedaten');
    }

    // Check if user is inactive in localStorage
    const inactiveUsers = getInactiveUsers();
    if (inactiveUsers[employee.id] || !employee.isActive) {
      throw new Error(
        'Ihr Account wurde gesperrt. Bitte kontaktieren Sie Ihren Vorgesetzten oder die IT-Abteilung für Unterstützung.'
      );
    }

    if (!password) {
      throw new Error('Password wird benötigt');
    }

    // In a real app, we would verify the password hash here
    if (password !== employee.passwordHash) {
      throw new Error('Ungültige Anmeldedaten');
    }

    dispatch(loginSuccess(employee));
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