import type { Employee } from '../types';

export interface AccessRight {
  ID: number;
  EmployeeID: number;
  AccessRightID: number;
  Name: string;
}

const API_URL = 'http://localhost:5000/api';

export const accessRightsApi = {
  async getAll(): Promise<AccessRight[]> {
    try {
      const response = await fetch(`${API_URL}/access-rights`);
      if (!response.ok) throw new Error('Failed to fetch access rights');
      return response.json();
    } catch (error) {
      console.error('Error fetching access rights:', error);
      throw error;
    }
  },

  async getEmployeeAccessRights(employeeId: string): Promise<string[]> {
    try {
      const response = await fetch(`${API_URL}/employee-access-rights/${employeeId}`);
      if (!response.ok) return ['employee'];
      const data: AccessRight[] = await response.json();
      return data.map(right => right.Name.toLowerCase());
    } catch (error) {
      console.error('Error fetching employee access rights:', error);
      return ['employee'];
    }
  }
};