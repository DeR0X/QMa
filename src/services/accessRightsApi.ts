export interface AccessRight {
    id: number;
    name: string;
    description: string;
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
        if (!response.ok) return ['employee']; // Default access right
        const data = await response.json();
        return data.length > 0 ? data : ['employee'];
      } catch (error) {
        console.error('Error fetching employee access rights:', error);
        return ['employee']; // Return default access right on error
      }
    }
  };