import { toast } from 'sonner';

export interface Qualification {
  ID?: number;
  Name: string;
  Description: string;
  ValidityInMonth: number;
  IsMandatory: boolean;
  RequiredQualifications: string[];
  AssignmentType: 'jobTitle' | 'additionalFunction' | 'mandatory';
  JobTitleIDs?: string[];
  AdditionalFunctionIDs?: string[];
}

const API_URL = 'http://localhost:5000/api';

export const qualificationsApi = {
  async getAll(): Promise<Qualification[]> {
    try {
      const response = await fetch(`${API_URL}/qualifications`);
      if (!response.ok) throw new Error('Failed to fetch qualifications');
      return response.json();
    } catch (error) {
      console.error('Error fetching qualifications:', error);
      throw error;
    }
  },

  async create(data: Omit<Qualification, 'ID'>): Promise<Qualification> {
    try {
      const response = await fetch(`${API_URL}/qualifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create qualification');
      }

      return response.json();
    } catch (error) {
      console.error('Error creating qualification:', error);
      throw error;
    }
  },

  async update(id: number, data: Partial<Qualification>): Promise<Qualification> {
    try {
      const response = await fetch(`${API_URL}/qualifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update qualification');
      }

      return response.json();
    } catch (error) {
      console.error('Error updating qualification:', error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/qualifications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to delete qualification');
      }
    } catch (error) {
      console.error('Error deleting qualification:', error);
      throw error;
    }
  },
};