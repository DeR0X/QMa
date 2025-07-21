import { toast } from 'sonner';
import apiClient from './apiClient';

export interface AdditionalSkill {
  ID?: number;
  Name: string;
  Description: string;
}

export const additionalFunctionsApi = {
  async getAll(): Promise<AdditionalSkill[]> {
    try {
      return apiClient.get('/additional-skills');
    } catch (error) {
      console.error('Error fetching additional skills:', error);
      throw error;
    }
  },

  async create(data: Omit<AdditionalSkill, 'ID'>): Promise<AdditionalSkill> {
    try {
      return apiClient.post('/additional-skills', data);
    } catch (error) {
      console.error('Error creating additional skill:', error);
      throw error;
    }
  },

  async update(id: number, data: Partial<AdditionalSkill>): Promise<AdditionalSkill> {
    try {
      // Log the request details for debugging
      console.log('Updating additional skill:', { id, data });
      
      return apiClient.put(`/additional-skills/${id}`, data);
    } catch (error) {
      toast.error(`Fehler beim Aktualisieren: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      return apiClient.delete(`/additional-skills/${id}`);
    } catch (error) {
      console.error('Error deleting additional skill:', error);
      throw error;
    }
  },
};