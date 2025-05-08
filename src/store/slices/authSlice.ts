import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Employee } from "../../types";
import { accessRightsApi } from "../../services/accessRightsApi";

interface AuthState {
  employee: Employee | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  sessionExpiry: number | null;
  accessRights: string[];
  availableAccessRights: { id: number; name: string; description: string; }[];
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
    accessRights: [],
    availableAccessRights: [],
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
      state.accessRights = [];
      state.availableAccessRights = [];
      localStorage.removeItem("auth");
    },
    refreshSession: (state) => {
      if (state.isAuthenticated) {
        state.sessionExpiry = Date.now() + 30 * 60 * 1000;
        localStorage.setItem("auth", JSON.stringify(state));
      }
    },
    setAccessRights: (state, action: PayloadAction<string[]>) => {
      state.accessRights = action.payload;
      if (state.employee) {
        // Update employee role and AccessRight based on the actual rights from the database
        const accessRights = action.payload.map(right => right.toLowerCase());
        let role = 'employee';
        let accessRight = 'EMPLOYEE';

        if (accessRights.includes('admin')) {
          role = 'admin';
          accessRight = 'ADMIN';
        } else if (accessRights.includes('hr')) {
          role = 'hr';
          accessRight = 'HR';
        } else if (accessRights.includes('supervisor')) {
          role = 'supervisor';
          accessRight = 'SUPERVISOR';
        }

        state.employee.role = role;
        state.employee.AccessRight = accessRight;
      }
      localStorage.setItem("auth", JSON.stringify(state));
    },
    setAvailableAccessRights: (state, action: PayloadAction<{ id: number; name: string; description: string; }[]>) => {
      state.availableAccessRights = action.payload;
      localStorage.setItem("auth", JSON.stringify(state));
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  refreshSession,
  setAccessRights,
  setAvailableAccessRights,
} = authSlice.actions;

export const toggleUserActive = (userId: string, isActive: boolean) => ({
  type: 'auth/toggleUserActive',
  payload: { userId, isActive },
});

export const hasHRPermissions = (employee: Employee | null) => {
  if (!employee) return false;
  return employee.role === 'hr' || employee.role === 'admin';
};

export const hasPermission = (
  employee: Employee | null,
  permission: string,
) => {
  if (!employee) return false;
  const role = employee.role;

  switch (role) {
    case "admin":
      return true;
    case "hr":
      return ["employees", "trainings", "qualifications", "documents", "dashboard", "additional"].includes(
        permission,
      );
    case "supervisor":
      return ["employees", "trainings", "documents", "dashboard", "additional"].includes(permission);
    default:
      return ["trainings", "documents", "dashboard"].includes(permission);
  }
};

export const login = (Username: string, password: string) => async (dispatch: any) => {
  dispatch(loginStart());

  try {
    // Login request
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

    // Store the token and user data
    localStorage.setItem('token', data.token);
    
    const userData = {
      ID: data.user.id,
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
      Supervisor: data.user.supervisor || '',
      AccessRightID: data.user.accessRightID || 0,
      AccessRight: 'EMPLOYEE', // Will be updated when access rights are fetched
      role: 'employee', // Will be updated when access rights are fetched
      PasswordHash: data.user.passwordHash,
      isActive: data.user.isActive,
    };
    
    // First dispatch login success to set the basic user data
    dispatch(loginSuccess(userData));

    // Then fetch employee-specific access rights
    try {
      console.log('Fetching access rights for employee:', userData.ID);
      const employeeAccessRights = await accessRightsApi.getEmployeeAccessRights(userData.ID.toString());
      console.log('Received access rights:', employeeAccessRights);
      if (employeeAccessRights.length > 0) {
        dispatch(setAccessRights(employeeAccessRights));
      }
    } catch (error) {
      console.error('Failed to fetch employee access rights:', error);
    }

    // Finally fetch all available access rights
    try {
      const allAccessRights = await accessRightsApi.getAll();
      dispatch(setAvailableAccessRights(allAccessRights.map(right => ({
        id: right.ID,
        name: right.Name,
        description: right.Name
      }))));
    } catch (error) {
      console.error('Failed to fetch all access rights:', error);
    }

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