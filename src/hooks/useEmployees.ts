import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../services/api';
import type { Employee } from '../types';

export interface EmployeeFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  department?: string;
  role?: string;
  isActive?: boolean;
  search?: string;
  fields?: string[];
  ids?: string[];
  startDate?: string;
  endDate?: string;
}

export interface EmployeeResponse {
  data: Employee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Central store for employee data
let employeeStore: {
  allEmployees: Employee[];
  lastFetched: number;
  isInitialized: boolean;
} = {
  allEmployees: [],
  lastFetched: 0,
  isInitialized: false,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to check if cache is valid
const isCacheValid = () => {
  return employeeStore.isInitialized && (Date.now() - employeeStore.lastFetched) < CACHE_DURATION;
};

// Helper function to filter and paginate employees
const filterAndPaginateEmployees = (employees: Employee[], filters: EmployeeFilters) => {
  let filteredData = [...employees];

  // Apply search filter
  if (filters.search) {
    const searchTerms = filters.search.toLowerCase().split(' ');
    filteredData = filteredData.filter((employee) => {
      const searchableFields = [
        employee.FullName?.toLowerCase() || '',
        employee.StaffNumber?.toString().toLowerCase() || '',
        employee.eMail?.toLowerCase() || '',
        employee.Department?.toLowerCase() || '',
        employee.JobTitle?.toLowerCase() || '',
        employee.Supervisor?.toLowerCase() || ''
      ];
      
      return searchTerms.every(term => 
        searchableFields.some(field => field.includes(term))
      );
    });
  }

  // Apply department filter
  if (filters.department) {
    filteredData = filteredData.filter(emp => emp.Department === filters.department);
  }

  // Apply role filter
  if (filters.role) {
    filteredData = filteredData.filter(emp => emp.AccessRight === filters.role);
  }

  // Apply sorting
  if (filters.sortBy) {
    const sortField = filters.sortBy as keyof Employee;
    const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
    
    filteredData.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder * aValue.localeCompare(bValue);
      }
      if (aValue === undefined || bValue === undefined) return 0;
      return sortOrder * ((aValue > bValue) ? 1 : -1);
    });
  }

  // Apply pagination
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedData = filteredData.slice(start, end);

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total: filteredData.length,
      totalPages: Math.ceil(filteredData.length / limit)
    }
  };
};

// Main hook for accessing employee data
export function useEmployees(filters: EmployeeFilters = {}) {
  const queryClient = useQueryClient();

  return useQuery<EmployeeResponse>({
    queryKey: ['employees', filters],
    queryFn: async () => {
      try {
        // Check if we need to fetch fresh data
        if (!isCacheValid()) {
          const response = await employeeApi.getEmployeesFromView({ limit: 1000 }); // Fetch all employees
          employeeStore = {
            allEmployees: response.data,
            lastFetched: Date.now(),
            isInitialized: true
          };
        }

        // Return filtered and paginated data from cache
        return filterAndPaginateEmployees(employeeStore.allEmployees, filters);
      } catch (error) {
        console.error('Error handling employees:', error);
        throw error;
      }
    },
    staleTime: CACHE_DURATION,
  });
}

// Hook for accessing single employee
export function useEmployee(id: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      // First check store
      if (isCacheValid()) {
        const employee = employeeStore.allEmployees.find(emp => emp.ID.toString() === id);
        if (employee) {
          return employee;
        }
      }

      // If not in store or cache invalid, fetch all employees again
      const response = await employeeApi.getEmployeesFromView({ limit: 1000 });
      employeeStore = {
        allEmployees: response.data,
        lastFetched: Date.now(),
        isInitialized: true
      };

      return employeeStore.allEmployees.find(emp => emp.ID.toString() === id);
    },
    staleTime: CACHE_DURATION,
  });
}

// Hook for updating employee
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) =>
      employeeApi.updateEmployee(id, data),
    onSuccess: (updatedEmployee, variables) => {
      // Update store
      employeeStore.allEmployees = employeeStore.allEmployees.map(emp => 
        emp.ID.toString() === variables.id ? { ...emp, ...updatedEmployee } : emp
      );

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
    },
  });
}

// Hook for creating employee
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Employee, 'id'>) => employeeApi.createEmployee(data),
    onSuccess: (newEmployee) => {
      // Update store
      employeeStore.allEmployees = [...employeeStore.allEmployees, newEmployee];
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

// Hook for deleting employee
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeeApi.deleteEmployee(id),
    onSuccess: (_, id) => {
      // Update store
      employeeStore.allEmployees = employeeStore.allEmployees.filter(emp => 
        emp.ID.toString() !== id
      );

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
    },
  });
}