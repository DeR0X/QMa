import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

export interface DocumentCategory {
  ID: number;
  Name: string;
  Description?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  Category: string;
}

interface CreateCategoryData {
  Category: string;
  Description?: string;
}

// Fetch all document categories
async function fetchDocumentCategories(): Promise<DocumentCategory[]> {
  const data = await apiClient.get<DocumentCategory[]>('/document_categories');
  return Array.isArray(data) ? data : [data];
}

// Create a new document category
async function createDocumentCategory(categoryData: CreateCategoryData): Promise<DocumentCategory> {
  return apiClient.post<DocumentCategory>('/document_categories', categoryData);
}

// Hook to fetch document categories
export function useDocumentCategories() {
  return useQuery({
    queryKey: ['documentCategories'],
    queryFn: fetchDocumentCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to create a new document category
export function useCreateDocumentCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDocumentCategory,
    onSuccess: () => {
      // Invalidate and refetch document categories
      queryClient.invalidateQueries({ queryKey: ['documentCategories'] });
    },
  });
} 