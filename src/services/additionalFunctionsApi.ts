import { toast } from 'sonner';

export interface AdditionalSkill {
  ID?: number;
  Name: string;
  Description: string;
}

const API_URL = 'http://localhost:5000/api';

export const additionalFunctionsApi = {
  async getAll(): Promise<AdditionalSkill[]> {
    try {
      const response = await fetch(`${API_URL}/additional-skills`);
      if (!response.ok) throw new Error('Failed to fetch additional skills');
      return response.json();
    } catch (error) {
      console.error('Error fetching additional skills:', error);
      throw error;
    }
  },

  async create(data: Omit<AdditionalSkill, 'ID'>): Promise<AdditionalSkill> {
    try {
      const response = await fetch(`${API_URL}/additional-skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create additional skill');
      }

      return response.json();
    } catch (error) {
      console.error('Error creating additional skill:', error);
      throw error;
    }
  },

  async update(id: number, data: Partial<AdditionalSkill>): Promise<AdditionalSkill> {
    try {
      const response = await fetch(`${API_URL}/additional-skills/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update additional skill');
      }

      return response.json();
    } catch (error) {
      console.error('Error updating additional skill:', error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/additional-skills/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to delete additional skill');
      }
    } catch (error) {
      console.error('Error deleting additional skill:', error);
      throw error;
    }
  },
};