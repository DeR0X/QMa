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
  refreshSession,
} = authSlice.actions;

export const toggleUserActive = (userId: string, isActive: boolean) => ({
  type: 'auth/toggleUserActive',
  payload: { userId, isActive },
});

export const hasHRPermissions = (employee: Employee | null) => {
  return employee?.role === 'admin' || employee?.role === 'hr';
};

export const hasPermission = (
  employee: Employee | null,
  permission: string,
) => {
  if (!employee) return false;

  switch (employee.role) {
    case "admin":
      return true;
    case "hr":
      return ["employees", "trainings", "qualifications", "documents", "dashbaord"].includes(
        permission,
      );
    case "supervisor":
      return ["employees", "trainings", "documents", "dashboard"].includes(permission);
    case "employee":
      return ["trainings", "documents", "dashbaord"].includes(permission);
    default:
      return false;
  }
};

export const login =
  (Username: string, password: string) => async (dispatch: any) => {
    dispatch(loginStart());

    try {
      const response = await fetch("http://localhost:5000/api/v2/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Username, password }),
      });

      if (!response.ok) {
        throw new Error("Ungültige Anmeldedaten");
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Ungültige Anmeldedaten");
      }

      if (!data.user) {
        throw new Error("Ungültige Anmeldedaten");
      }

      /* if (!data.user.isActive) {
        throw new Error(
          "Ihr Account wurde gesperrt. Bitte kontaktieren Sie Ihren Vorgesetzten oder die IT-Abteilung für Unterstützung.",
        );
      } */

      // Store the token and user data
      localStorage.setItem('token', data.token);
      
      const userData = {
        id: data.user.id,
        SurName: data.user.surname,
        FirstName: data.user.firstName,
        FullName: `${data.user.firstName} ${data.user.surname}`,
        eMail: data.user.email,
        StaffNumber: data.user.staffNumber,
        Department: data.user.department,
        DepartmentID: data.user.departmentID,
        JobTitle: data.user.jobTitle,
        JobTitleID: data.user.jobTitleID,
        SupervisorID: data.user.supervisorID,
        role: data.user.role,
        PasswordHash: data.user.passwordHash,
        isActive: data.user.isActive,
      };
      
      dispatch(loginSuccess(userData));
    } catch (error) {
      console.error("Login error:", error);
      dispatch(
        loginFailure(
          error instanceof Error ? error.message : "Login fehlgeschlagen",
        ),
      );
    }
  };

export default authSlice.reducer;
