import { toast } from "sonner";
import apiClient from "./apiClient";

export interface Qualification {
  ID?: number;
  Name: string;
  Description: string;
  ValidityInMonth: number;
  IsMandatory: boolean;
  RequiredQualifications: string[];
  Herkunft: 'Pflicht' | 'Job' | 'Zusatz';
  JobTitleID?: string[] | string;
  JobTitle?: string;
  AdditionalSkillID?: number;
  AdditionalSkillName?: string;
  AdditionalSkillNames?: string[];
  AdditionalSkillIDs?: (number | string)[];
  AdditionalFunctionID?: string[];
  AdditionalFunctionIDs?: string[];
  toQualifyUntil?: string; // Datum bis wann die Qualifikation absolviert werden muss
}

export const qualificationsApi = {
  async getAll(): Promise<Qualification[]> {
    try {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      const qualResponse = await apiClient.get<Qualification[]>('/v2/qualification-view');
      await delay(500); // 500ms delay
      
      const jobTitleQualResponse = await apiClient.get<any[]>('/job-titles-qualifications');
      await delay(500); // 500ms delay
      
      const additionalSkillQualResponse = await apiClient.get<any[]>('/additional-skills-qualifications');

      const [qualifications, jobTitleQuals, additionalSkillQuals] = await Promise.all([
        qualResponse,
        jobTitleQualResponse,
        additionalSkillQualResponse
      ]);

      return qualifications.map((qual: Qualification) => {
        const jobTitleQual = jobTitleQuals.find((jtq: any) => jtq.QualificationID === qual.ID);
        
        // Sammle alle Zusatzfunktionen für diese Qualifikation
        const qualificationAdditionalSkills = additionalSkillQuals.filter((asq: any) => asq.QualificationID === qual.ID);
        const additionalSkillNames = qualificationAdditionalSkills.map((asq: any) => asq.AdditionalSkillName).filter(Boolean);
        const additionalSkillIDs = qualificationAdditionalSkills.map((asq: any) => asq.AdditionalSkillID).filter(Boolean);

        const toQualifyUntil = qual.toQualifyUntil 
          ? new Date(qual.toQualifyUntil).toISOString().split('T')[0]
          : undefined;

        return {
          ...qual,
          JobTitle: jobTitleQual?.JobTitle || undefined,
          AdditionalSkillName: additionalSkillNames.length > 0 ? additionalSkillNames.join(', ') : undefined,
          AdditionalSkillNames: additionalSkillNames,
          AdditionalSkillIDs: additionalSkillIDs,
          toQualifyUntil: toQualifyUntil,
        };
      });
    } catch (error) {
      console.error("Error fetching qualification-view:", error);
      throw error;
    }
  },

  async create(data: Omit<Qualification, "ID">): Promise<Qualification> {
    try {
      // Erstelle die Qualifikation mit allen notwendigen Daten in einem Request
      const createResponse = await apiClient.post<Qualification>('/qualifications', {
        Name: data.Name,
        Description: data.Description,
        ValidityInMonth: data.ValidityInMonth,
        Herkunft: data.Herkunft,
        IsMandatory: data.IsMandatory,
        // Übergebe die IDs direkt, die API erstellt die Verknüpfungen automatisch
        JobTitleID: data.JobTitleID || null,
        // Für Zusatzfunktionen: Wenn AdditionalFunctionIDs vorhanden sind, verwende diese direkt
        AdditionalSkillID: data.AdditionalFunctionIDs && data.AdditionalFunctionIDs.length > 0 ? data.AdditionalFunctionIDs[0] : null,
      });

      // Erstelle Verknüpfungen für alle ausgewählten Zusatzfunktionen
      if (data.Herkunft === "Zusatz" && createResponse.ID && data.AdditionalFunctionIDs && data.AdditionalFunctionIDs.length > 0) {
        // Erstelle Verknüpfungen für alle ausgewählten Zusatzfunktionen
        for (const additionalFunctionId of data.AdditionalFunctionIDs) {
          try {
            await apiClient.post('/additional-skills-qualifications', {
              QualificationID: createResponse.ID,
              AdditionalSkillID: parseInt(additionalFunctionId)
            });
          } catch (error) {
            console.warn(`Failed to create additional skill qualification link for ID: ${additionalFunctionId}`);
          }
        }
      }

      return {
        ...data,
        ...createResponse,
        ID: createResponse.ID,
        Herkunft: data.Herkunft,
        IsMandatory: data.IsMandatory,
      };
    } catch (error) {
      console.error("Error creating qualification:", error);
      throw error;
    }
  },

  async update(
    id: number,
    data: Partial<Qualification>,
  ): Promise<Qualification> {
    try {
      // Aktualisiere die Qualifikation
      const response = await apiClient.put<Qualification>(`/qualifications/${id}`, {
        Name: data.Name,
        Description: data.Description,
        ValidityInMonth: data.ValidityInMonth,
        Herkunft: data.Herkunft,
        IsMandatory: data.Herkunft === "Pflicht" ? true : false,
        JobTitleID: data.JobTitleID || null,
        AdditionalSkillID: data.AdditionalSkillID || null,
      });

      // Aktualisiere JobTitle-Verknüpfungen
      if (data.Herkunft === "Job" && data.JobTitleID) {
        try {
          // Stelle sicher, dass JobTitleID eine einzelne ID ist
          const jobTitleId = Array.isArray(data.JobTitleID) ? data.JobTitleID[0] : data.JobTitleID;
          
          if (jobTitleId) {
            // Verwende den neuen PUT-Endpunkt für JobTitle-Verknüpfungen
            await apiClient.put(
              `/job-titles-qualifications/qualification/${id}`,
              {
                JobTitleID: jobTitleId
              }
            );
          }
        } catch (error) {
          console.warn("Failed to update job title qualification link");
        }
      }

      // Aktualisiere AdditionalSkill-Verknüpfungen für Zusatzqualifikationen
      if (data.Herkunft === "Zusatz") {
        try {
          // Lösche alle bestehenden Verknüpfungen
          await apiClient.delete(`/additional-skills-qualifications/qualification/${id}`);
          
          // Erstelle neue Verknüpfungen für alle ausgewählten Zusatzfunktionen
          if (data.AdditionalFunctionIDs && data.AdditionalFunctionIDs.length > 0) {
            for (const additionalFunctionId of data.AdditionalFunctionIDs) {
              try {
                await apiClient.post('/additional-skills-qualifications', {
                  QualificationID: id,
                  AdditionalSkillID: parseInt(additionalFunctionId)
                });
              } catch (error) {
                console.warn(`Failed to create additional skill qualification link for ID: ${additionalFunctionId}`);
              }
            }
          }
        } catch (error) {
          console.error("Error updating additional skill qualification links:", error);
        }
      }

      return response;
    } catch (error) {
      console.error("Error updating qualification:", error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/qualifications/${id}`);
    } catch (error) {
      console.error("Error deleting qualification:", error);
      throw error;
    }
  },

  async search(name: string): Promise<Qualification[]> {
    try {
      return apiClient.get<Qualification[]>(`/qualifications/search?name=${encodeURIComponent(name)}`);
    } catch (error) {
      console.error("Error searching qualifications:", error);
      throw error;
    }
  },
};


