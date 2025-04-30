import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Employee } from "../../types";

interface AuthState {
  employee: Employee | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  sessionExpiry: number | null;
}

const loadInitialState = (): AuthState => {
  const savedAuth = localStorage.getItem("auth");
  if (savedAuth) {
    const parsed = JSON.parse(savedAuth);
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
  name: "auth",
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
      state.sessionExpiry = Date.now() + 30 * 60 * 1000;
      localStorage.setItem("auth", JSON.stringify(state));
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
      localStorage.removeItem("auth");
    },
    updateUserActiveStatus: (
      state,
      action: PayloadAction<{ userId: string; isActive: boolean }>,
    ) => {
      if (state.employee?.ID === Number(action.payload.userId)) {
        state.employee.isActive = action.payload.isActive;
      }
    },
    refreshSession: (state) => {
      if (state.isAuthenticated) {
        state.sessionExpiry = Date.now() + 30 * 60 * 1000;
        localStorage.setItem("auth", JSON.stringify(state));
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
  refreshSession,
} = authSlice.actions;

export const hasHRPermissions = (employee: Employee | null) => {
  return employee?.role === "hr";
};

export const canManageEmployees = (employee: Employee | null) => {
  return employee?.role === "hr" || employee?.role === "supervisor";
};

export const canAccessAnalytics = (employee: Employee | null) => {
  return employee?.role === "hr";
};

export const login = (Username: string, password: string) => async (dispatch: any) => {
  dispatch(loginStart());

  try {
    const response = await fetch('http://localhost:5000/api/v2/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Username, password })
    });

    if (!response.ok) {
      throw new Error('Ungültige Anmeldedaten');
    }

    const data = await response.json();
    console.log(data);
/*     if (!data.employee.IsActive) {
      throw new Error("Ihr Account wurde gesperrt. Bitte kontaktieren Sie Ihren Vorgesetzten oder die IT-Abteilung für Unterstützung.");
    } */

    dispatch(loginSuccess(data.employee));
  } catch (error) {
    console.error("Login error:", error);
    dispatch(loginFailure(error instanceof Error ? error.message : "Login fehlgeschlagen"));
  }
};

export const toggleUserActive = (userId: string, isActive: boolean) => async (dispatch: any) => {
  try {
    const response = await fetch(`http://localhost:5000/api/v2/employees-view/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive })
    });

    if (!response.ok) {
      throw new Error('Fehler beim Aktualisieren des Benutzerstatus');
    }

    dispatch(updateUserActiveStatus({ userId, isActive }));
  } catch (error) {
    console.error("Error toggling user status:", error);
  }
};

export default authSlice.reducer;