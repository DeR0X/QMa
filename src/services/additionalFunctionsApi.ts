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
      // Log the request details for debugging
      console.log('Updating additional skill:', { id, data });
      
      const response = await fetch(`${API_URL}/additional-skills/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // Log the response status and headers
      console.log('Update response status:', response.status);
      console.log('Update response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update error response:', errorText);
        throw new Error(errorText || 'Failed to update additional skill');
      }

      const updatedData = await response.json();
      console.log('Update successful:', updatedData);
      return updatedData;
    } catch (error) {
      console.error('Error updating additional skill:', error);
      toast.error(`Fehler beim Aktualisieren: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
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