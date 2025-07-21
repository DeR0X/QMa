import { useQuery } from '@tanstack/react-query';
import { buildApiUrl } from '../config/api';

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
    queryKey: ['qualificationViews', qualificationIds.sort().join(',')],
    queryFn: async () => {
      if (!qualificationIds.length) return {};
      
          try {
        // Fetch ALL qualification views in a single API call instead of one per ID
            const response = await fetch(buildApiUrl(`/qualification-view/`, 'v2'));
        if (!response.ok) throw new Error('Failed to fetch qualification views');
        
        const allViews = await response.json();
        
        // Filter and map the data to only include requested IDs
        const views: Record<number, QualificationView> = {};
        if (Array.isArray(allViews)) {
          allViews.forEach(view => {
            if (qualificationIds.includes(view.ID)) {
              views[view.ID] = view;
            }
          });
        }
        
        return views;
          } catch (error) {
        console.error('Error fetching qualification views:', error);
        throw error;
          }
    },
    enabled: qualificationIds.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

// Keep the single qualification view hook for backward compatibility
export function useQualificationView(qualificationId?: number) {
  const { data } = useQualificationViews(qualificationId ? [qualificationId] : []);
  return {
    data: qualificationId ? data?.[qualificationId] : undefined
  };
} 