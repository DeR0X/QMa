import type { Employee, EmployeeFilters } from '../types';

const API_BASE_URL = 'http://127.0.0.1:5000/api/v2';

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

export interface EmployeeQualificationData {
  EmployeeID: string;
  QualificationID: string;
  qualifiedFrom: string;
  toQualifyUntil: string;
  isQualifiedUntil: string;
}

export const employeeApi = {
  async getEmployees(filters: EmployeeFilters = {}) {
    const queryString = buildQueryString(filters);
    const response = await fetch(`${API_BASE_URL}/employees-view${queryString}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch employees');
    }
    
    return response.json();
  },

  async getEmployeeById(id: string, fields?: string[]) {
    const queryString = fields ? buildQueryString({ fields: fields.join(',') }) : '';
    const response = await fetch(`${API_BASE_URL}/employees-view/${id}${queryString}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch employee');
    }
    
    return response.json();
  },

  async createEmployee(data: Omit<Employee, 'id'>) {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create employee');
    }
    
    return response.json();
  },

  async updateEmployee(id: string, data: Partial<Employee>) {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update employee');
    }
    
    return response.json();
  },

  async deleteEmployee(id: string) {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete employee');
    }
    
    return response.json();
  },

  async addEmployeeQualification(employeeId: string, data: EmployeeQualificationData) {
    const response = await fetch(`${API_BASE_URL}/employee-qualifications/${employeeId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to add employee qualification');
    }

    return response.json();
  },

  async getEmployeeQualifications(employeeId: string) {
    const response = await fetch(`${API_BASE_URL}/employee-qualifications/${employeeId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch employee qualifications');
    }
    
    return response.json();
  }
};