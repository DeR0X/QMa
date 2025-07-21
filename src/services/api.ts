import type { Employee, EmployeeFilters } from '../types';
import apiClient from './apiClient';

function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        searchParams.append(key, value.join(','));
      } else {
        searchParams.append(key, value.toString());
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export const employeeApi = {
  async getEmployeesFromView(filters: EmployeeFilters = {}) {
    const queryString = buildQueryString(filters);
    return apiClient.get(`/employees-view${queryString}`, 'v2');
  },

  async getEmployeeByIdFromView(id: string) {
    return apiClient.get(`/employees-view/${id}`, 'v2');
  },

  async createEmployee(data: Omit<Employee, 'id'>) {
    return apiClient.post('/employees', data, 'v2');
  },

  async updateEmployee(id: string, data: Partial<Employee>) {
    return apiClient.put(`/employees/${id}`, data, 'v2');
  },

  async deleteEmployee(id: string) {
    return apiClient.delete(`/employees/${id}`, 'v2');
  }
};