import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Employee } from '../../types';
import { employees } from '../../data/mockData';

interface AuthState {
  employee: Employee | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  employee: null,
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
    loginSuccess: (state, action: PayloadAction<Employee>) => {
      state.employee = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
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
    },
    updateUserActiveStatus: (state, action: PayloadAction<{ userId: string; isActive: boolean }>) => {
      if (state.employee?.id === action.payload.userId) {
        state.employee.isActive = action.payload.isActive;
      }
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUserActiveStatus } = authSlice.actions;

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