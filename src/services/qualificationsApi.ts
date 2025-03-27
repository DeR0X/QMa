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
      // Erstelle zuerst die Qualifikation
      const response = await fetch(`${API_URL}/qualifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          IsMandatory: data.AssignmentType === 'mandatory' ? 1 : 0,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create qualification');
      }

      const result = await response.json();
      const qualificationId = result.qualificationId;
      console.log('Created qualification with ID:', qualificationId);

      // Wenn JobTitles ausgewählt wurden, erstelle die Verknüpfungen mit der neuen qualificationId
      if (data.AssignmentType === 'jobTitle' && data.JobTitleIDs && data.JobTitleIDs.length > 0) {
        await Promise.all(data.JobTitleIDs.map(jobTitleId => 
          fetch(`${API_URL}/job-titles-qualifications`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              JobTitleID: jobTitleId,
              QualificationID: qualificationId
            }),
          })
        ));
      }

      // Wenn AdditionalFunctions ausgewählt wurden, erstelle die Verknüpfungen mit der neuen qualificationId
      if (data.AssignmentType === 'additionalFunction' && data.AdditionalFunctionIDs && data.AdditionalFunctionIDs.length > 0) {
        console.log('Creating additional function links for qualification:', qualificationId);
        
        try {
          await Promise.all(data.AdditionalFunctionIDs.map(async additionalFunctionId => {
            const linkResponse = await fetch(`${API_URL}/additional-skills-qualifications`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                AdditionalSkillID: additionalFunctionId,
                QualificationID: qualificationId
              }),
            });

            if (!linkResponse.ok) {
              const linkError = await linkResponse.text();
              throw new Error(`Failed to create additional function link: ${linkError}`);
            }

            const linkResult = await linkResponse.json();
            console.log('Created link:', linkResult);
          }));
        } catch (linkError) {
          console.error('Error creating additional function links:', linkError);
          throw linkError;
        }
      }

      // Gib die vollständige Qualifikation zurück
      return {
        ...data,
        ID: qualificationId
      };
    } catch (error) {
      console.error('Error creating qualification:', error);
      throw error;
    }
  },

  async update(id: number, data: Partial<Qualification>): Promise<Qualification> {
    try {
      // Aktualisiere die Qualifikation
      const response = await fetch(`${API_URL}/qualifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          IsMandatory: data.AssignmentType === 'mandatory' ? 1 : 0,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update qualification');
      }

      const updatedQualification = await response.json();

      // Aktualisiere JobTitle-Verknüpfungen
      if (data.AssignmentType === 'jobTitle' && data.JobTitleIDs) {
        // Lösche zuerst alle bestehenden Verknüpfungen
        await fetch(`${API_URL}/job-titles-qualifications/qualification/${id}`, {
          method: 'DELETE',
        });

        // Erstelle neue Verknüpfungen
        await Promise.all(data.JobTitleIDs.map(jobTitleId =>
          fetch(`${API_URL}/job-titles-qualifications`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              JobTitleID: jobTitleId,
              QualificationID: id
            }),
          })
        ));
      }

      // Aktualisiere AdditionalFunction-Verknüpfungen
      if (data.AssignmentType === 'additionalFunction' && data.AdditionalFunctionIDs) {
        // Lösche zuerst alle bestehenden Verknüpfungen
        await fetch(`${API_URL}/additional-skills-qualifications/qualification/${id}`, {
          method: 'DELETE',
        });

        // Erstelle neue Verknüpfungen
        await Promise.all(data.AdditionalFunctionIDs.map(additionalFunctionId =>
          fetch(`${API_URL}/additional-skills-qualifications`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              AdditionalSkillID: additionalFunctionId,
              QualificationID: id
            }),
          })
        ));
      }

      return updatedQualification;
    } catch (error) {
      console.error('Error updating qualification:', error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      // Lösche zuerst alle Verknüpfungen
      await Promise.all([
        fetch(`${API_URL}/job-titles-qualifications/qualification/${id}`, {
          method: 'DELETE',
        }),
        fetch(`${API_URL}/additional-skills-qualifications/qualification/${id}`, {
          method: 'DELETE',
        })
      ]);

      // Lösche dann die Qualifikation
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