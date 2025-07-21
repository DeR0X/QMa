import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Employee } from "../../types";
import { accessRightsApi } from "../../services/accessRightsApi";
import { buildApiUrl, API_BASE_URL_V2 } from '../../config/api';

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

        // First determine the base role and access right
        if (accessRights.includes('admin')) {
          role = 'admin';
          accessRight = 'admin';
        } else if (accessRights.includes('hr')) {
          role = 'hr';
          accessRight = 'hr';
        }

        // Supervisor status is handled separately and independently
        // It doesn't modify the accessRight, only adds to the role name
        // We preserve the isSupervisor value from the login data
        if (state.employee.isSupervisor === 1) {
          role = role === 'employee' ? 'supervisor' : `${role}_supervisor`;
        }

        // Update only the role and AccessRight, preserve other properties
        state.employee = {
          ...state.employee,
          role,
          AccessRight: accessRight
        };
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
  const accessRight = employee.AccessRight?.toString().toLowerCase();
  return accessRight === "hr" || accessRight === "admin" || accessRight === "2" || accessRight === "3";
};

export const hasSupervisorPermissions = (employee: Employee | null) => {
  if (!employee) return false;
  return employee.isSupervisor === 1; // Admin (1) or Supervisor (3)
};

export const hasPermission = (
  employee: Employee | null,
  permission: string,
) => {
  if (!employee) return false;
  const accessRight = employee.AccessRight?.toString().toLowerCase();
  const isSupervisor = employee.isSupervisor === 1;

  // Special case for admin permission check
  if (permission === 'admin') {
    return accessRight === 'admin' || accessRight === '3';
  }

  // Special case for qualifications_or_supervisor permission
  if (permission === 'qualifications_or_supervisor') {
    return accessRight === 'hr' || accessRight === 'admin' || accessRight === '2' || accessRight === '3' || isSupervisor;
  }

  // Define base permissions for each level
  const employeePermissions = ["trainings", "dashboard"];
  const supervisorPermissions = [...employeePermissions, "employees", "additional", "documents"];
  const hrPermissions = [...supervisorPermissions, "qualifications"];
  const adminPermissions = [...hrPermissions, "password"];

  // Admin has all permissions
  if (accessRight === "admin" || accessRight === "3") return true;
  // HR has all permissions except password management
  if (accessRight === "hr" || accessRight === "2") return permission !== "password";
  // Supervisor permissions
  if (isSupervisor) {
    return supervisorPermissions.includes(permission);
  }
  
  return employeePermissions.includes(permission);
};

export const login = (Username: string, password: string) => async (dispatch: any) => {
  dispatch(loginStart());

  try {
    // Login request - send plain password, server will handle bcrypt comparison
    const response = await fetch(`${API_BASE_URL_V2}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Username, password }),
    });

    // Always try to parse JSON response, even for error status codes
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // If JSON parsing fails, throw a generic error
      throw new Error("Ungültige Anmeldedaten");
    }

    console.log('Login API response:', data);

    // Check if the response indicates success
    if (!response.ok || !data.success) {
      // For authentication failures, show a user-friendly message
      if (response.status === 401 || response.status === 403) {
        throw new Error("Personal Nummer oder Passwort falsch");
      }
      // For other errors, use the server message or fallback
      throw new Error(data.message || data.error || "Ungültige Anmeldedaten");
    }

    if (!data.user) {
      throw new Error("Ungültige Anmeldedaten");
    }

    // Check if user is active
    if (data.user.isActive === 0) {
      throw new Error("Ihr Konto ist deaktiviert. Bitte wenden Sie sich an die Personalabteilung.");
    }

    // Store the token and user data
    localStorage.setItem('token', data.token);
    
    // Fetch all employees from ViewEmployees and find the specific employee
    const employeeResponse = await fetch(`${API_BASE_URL_V2}/employees-view`);
    if (!employeeResponse.ok) {
      throw new Error("Fehler beim Laden der Mitarbeiterdaten");
    }
    const responseData = await employeeResponse.json();
    console.log('API Response:', responseData);
    
    // Check if we have a data property (common API response structure)
    const employeesData = responseData.data || responseData;
    if (!Array.isArray(employeesData)) {
      console.error('Unexpected API response structure:', responseData);
      throw new Error("Unerwartetes Format der Mitarbeiterdaten");
    }
    
    const employeeData = employeesData.find((emp: any) => emp.ID === data.user.id);
    
    if (!employeeData) {
      throw new Error("Mitarbeiterdaten nicht gefunden");
    }
    
    console.log('Found employee data:', employeeData);
    
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
      AccessRight: data.user.accessRightsID || 0,
      role: 'employee',
      PasswordHash: data.user.passwordHash,
      isActive: data.user.isActive,
      isSupervisor: employeeData.isSupervisor || 0, // Get supervisor status from ViewEmployees
    };
    
    console.log('Processed user data:', userData);
    
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