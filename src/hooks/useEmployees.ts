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

// Store for cached employee data
let cachedEmployees: Employee[] = [];

export function useEmployees(filters: EmployeeFilters = {}) {
  const queryClient = useQueryClient();

  return useQuery<EmployeeResponse>({
    queryKey: ['employees', filters],
    queryFn: async () => {
      try {
        // If we don't have cached data or it's a different filter, fetch from API
        if (cachedEmployees.length === 0) {
          const response = await employeeApi.getEmployeesFromView(filters);
          cachedEmployees = response.data;
          return response;
        }

        // Use cached data and apply filters
        let filteredData = [...cachedEmployees];

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

        // Apply other filters
        if (filters.department) {
          filteredData = filteredData.filter(emp => emp.Department === filters.department);
        }

        if (filters.role) {
          filteredData = filteredData.filter(emp => emp.AccessRight === filters.role);
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
      } catch (error) {
        console.error('Error handling employees:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => {
      // First check cached data
      const cachedEmployee = cachedEmployees.find(emp => emp.ID.toString() === id);
      if (cachedEmployee) {
        return Promise.resolve(cachedEmployee);
      }
      // If not in cache, fetch from API
      return employeeApi.getEmployeeByIdFromView(id);
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) =>
      employeeApi.updateEmployee(id, data),
    onSuccess: (_, variables) => {
      // Update cached data
      cachedEmployees = cachedEmployees.map(emp => 
        emp.ID.toString() === variables.id ? { ...emp, ...variables.data } : emp
      );
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
    },
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Employee, 'ID'>) => employeeApi.createEmployee(data),
    onSuccess: (newEmployee) => {
      // Add to cached data
      cachedEmployees = [...cachedEmployees, newEmployee];
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeeApi.deleteEmployee(id),
    onSuccess: (_, id) => {
      // Remove from cached data
      cachedEmployees = cachedEmployees.filter(emp => emp.ID.toString() !== id);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
    },
  });
}