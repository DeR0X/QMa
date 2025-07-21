import type { Employee } from '../types';
import apiClient from './apiClient';

export interface AccessRight {
  ID: number;
  EmployeeID: number;
  AccessRightID: number;
  Name: string;
}

export const accessRightsApi = {
  async getAll(): Promise<AccessRight[]> {
    try {
      return apiClient.get('/access-rights');
    } catch (error) {
      console.error('Error fetching access rights:', error);
      throw error;
    }
  },

  async getEmployeeAccessRights(employeeId: string): Promise<string[]> {
    try {
      const data: AccessRight[] = await apiClient.get(`/employee-access-rights/${employeeId}`);
      return data.map(right => right.Name.toLowerCase());
    } catch (error) {
      console.error('Error fetching employee access rights:', error);
      return ['employee'];
    }
  }
};