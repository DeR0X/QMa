import { useQuery } from '@tanstack/react-query';

export interface QualificationView {
  ID: number;
  Name: string;
  Description: string;
  ValidityInMonth: number;
  Herkunft: 'Pflicht' | 'Job' | 'Zusatz';
  AdditionalSkillID: number | null;
  JobTitleID: number | null;
  DurationInHours: number;
}

export function useQualificationViews(qualificationIds: number[]) {
  return useQuery<Record<number, QualificationView>>({
    queryKey: ['qualificationViews', qualificationIds],
    queryFn: async () => {
      if (!qualificationIds.length) return {};
      
      const views: Record<number, QualificationView> = {};
      await Promise.all(
        qualificationIds.map(async (id) => {
          try {
            const response = await fetch(`http://localhost:5000/api/v2/qualification-view/${id}`);
            if (!response.ok) throw new Error(`Failed to fetch qualification view for ID ${id}`);
            const data = await response.json();
            views[id] = data;
          } catch (error) {
            console.error(`Error fetching qualification view for ID ${id}:`, error);
          }
        })
      );
      return views;
    },
    enabled: qualificationIds.length > 0
  });
}

// Keep the single qualification view hook for backward compatibility
export function useQualificationView(qualificationId?: number) {
  const { data } = useQualificationViews(qualificationId ? [qualificationId] : []);
  return {
    data: qualificationId ? data?.[qualificationId] : undefined
  };
} 