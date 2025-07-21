import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { universalApiRequest, baseApi, v2Api } from '../services/apiClient';
import { useMemo } from 'react';

export interface DocumentUploadData {
  FileName: string;
  FilePath: string;
  Description?: string;
  UploadedBy: string;
  CategoryID?: number;
  Tags?: string;
}

export interface DocumentResponse {
  documentID: number;
  FileName: string;
  FilePath: string;
  Description?: string;
  UploadedBy: string;
  CategoryID?: number;
  Tags?: string;
  CreatedAt: string;
  UpdatedAt?: string;
}

export interface TrainingDocumentLinkData {
  TrainingID: number;
  DocumentID: number;
}

export interface TrainingDocumentLinkResponse {
  ID: number;
  TrainingID: number;
  DocumentID: number;
  CreatedAt: string;
}

export interface EmployeeDocumentLinkData {
  EmployeeID: string;
  DocumentID: number;
}

export interface EmployeeDocumentLinkResponse {
  ID: number;
  EmployeeID: number;
  DocumentID: number;
  CreatedAt: string;
}

export interface EmployeeDocumentView {
  EmployeeID: number;
  FullName: string;
  DocumentID: number;
  FileName: string;
  FilePath: string;
  Description?: string;
  UploadedAt: string;
  UploadedByID: number;
  UploadedBy: string;
  CategoryID?: number;
  Category?: string;
  Tags?: string;
  ID?: number;
  CategoryName?: string;
  EmployeeName?: string;
}

export interface TrainingDocumentView {
  TrainingID: number;
  TrainingName?: string;
  DocumentID: number;
  FileName: string;
  FilePath: string;
  Description?: string;
  UploadedAt: string;
  UploadedByID: number;
  UploadedBy: string;
  CategoryID?: number;
  Category?: string;
  Tags?: string;
}

export interface UnifiedDocumentView extends EmployeeDocumentView {
  DocumentType: 'employee' | 'training';
  TrainingID?: number;
  TrainingName?: string;
}

// Save document to database
async function saveDocument(documentData: DocumentUploadData): Promise<DocumentResponse> {
  console.log('Saving document:', documentData);
  return await baseApi.post<DocumentResponse>('/documents', documentData);

}

// Link document to training
async function linkTrainingDocument(linkData: TrainingDocumentLinkData): Promise<TrainingDocumentLinkResponse> {
  return await baseApi.post<TrainingDocumentLinkResponse>('/training-documents', linkData);
}

// Link document to employee
async function linkEmployeeDocument(linkData: EmployeeDocumentLinkData): Promise<EmployeeDocumentLinkResponse> {
  return await baseApi.post<EmployeeDocumentLinkResponse>('/employee-documents', linkData);
}

// Fetch employee documents from view
async function fetchEmployeeDocuments(employeeId: number): Promise<EmployeeDocumentView[]> {
  return await baseApi.get<EmployeeDocumentView[]>(`/documents/${employeeId}`);
}

// Fetch all documents for tag analysis
async function fetchAllDocuments(): Promise<EmployeeDocumentView[]> {
  return await v2Api.get<EmployeeDocumentView[]>('/employees-documents-view');
}

// Function to analyze tag usage frequency
export function analyzeTagUsage(documents: EmployeeDocumentView[]): { tag: string; count: number }[] {
  const tagCounts = new Map<string, number>();
  
  documents.forEach(doc => {
    if (doc.Tags) {
      doc.Tags.split(';').forEach(tag => {
        const trimmedTag = tag.trim();
        if (trimmedTag) {
          tagCounts.set(trimmedTag, (tagCounts.get(trimmedTag) || 0) + 1);
        }
      });
    }
  });

  // Convert to array and sort by count (descending)
  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

// Hook to save a document to the database
export function useSaveDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveDocument,
    onSuccess: () => {
      // Invalidate relevant queries if needed
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      queryClient.invalidateQueries({ queryKey: ['all-unified-documents'] });
      queryClient.invalidateQueries({ queryKey: ['training-documents'] });
      queryClient.invalidateQueries({ queryKey: ['employee-documents'] });
      queryClient.invalidateQueries({ queryKey: ['all-documents'] });
    },
  });
}

// Hook to link a document to a training
export function useLinkTrainingDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: linkTrainingDocument,
    onSuccess: () => {
      // Invalidate relevant queries if needed
      queryClient.invalidateQueries({ queryKey: ['training-documents'] });
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      queryClient.invalidateQueries({ queryKey: ['all-unified-documents'] });
      queryClient.invalidateQueries({ queryKey: ['all-documents'] });
    },
  });
}

// Hook to link a document to an employee
export function useLinkEmployeeDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: linkEmployeeDocument,
    onSuccess: () => {
      // Invalidate relevant queries if needed
      queryClient.invalidateQueries({ queryKey: ['employee-documents'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['all-unified-documents'] });
      queryClient.invalidateQueries({ queryKey: ['all-documents'] });
    },
  });
}

// Hook to fetch employee documents
export function useEmployeeDocuments(employeeId: number) {
  return useQuery({
    queryKey: ['employee-documents', employeeId],
    queryFn: () => fetchEmployeeDocuments(employeeId),
    enabled: !!employeeId,
  });
}

// Hook to fetch all documents
export function useAllDocuments() {
  return useQuery({
    queryKey: ['all-documents'],
    queryFn: fetchAllDocuments,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get popular tags
export function usePopularTags() {
  const { data: allDocuments, isLoading, error } = useAllDocuments();
  
  const popularTags = useMemo(() => {
    if (!allDocuments) return [];
    return analyzeTagUsage(allDocuments);
  }, [allDocuments]);

  return {
    popularTags,
    isLoading,
    error
  };
} 

// Function to download a document
async function downloadDocument(documentId: number): Promise<Blob> {
  return await universalApiRequest(`/documents/${documentId}/download`, {
    apiType: 'base',
    headers: {
      'Accept': 'application/octet-stream',
    }
  });
}

// Hook to download a document
export function useDocumentDownload() {
  return useMutation({
    mutationFn: downloadDocument,
  });
}

export function useDocumentInfo(documentId?: number) {
  return useQuery({
    queryKey: ['documentInfo', documentId],
    queryFn: async () => {
      if (!documentId) return null;
      return await baseApi.get<any>(`/documents/${documentId}`);
    },
    enabled: !!documentId
  });
}

// Function to get document preview URL
async function getDocumentPreview(documentId: number): Promise<string> {
  const data = await baseApi.get<{previewUrl: string}>(`/document-view/${documentId}`);
  return data.previewUrl;
}

// Hook to get document preview
export function useDocumentPreview() {
  return useMutation({
    mutationFn: getDocumentPreview,
  });
}

// Fetch training documents from v2/viewTrainingDocuments
async function fetchTrainingDocuments(): Promise<TrainingDocumentView[]> {
  return await v2Api.get<TrainingDocumentView[]>('/viewTrainingDocuments');
}

// Fetch all documents including both employee and training documents
async function fetchAllUnifiedDocuments(): Promise<UnifiedDocumentView[]> {
  try {
    // Fetch both employee and training documents in parallel
    const [employeeDocuments, trainingDocuments] = await Promise.all([
      fetchAllDocuments(),
      fetchTrainingDocuments()
    ]);

    // Convert employee documents to unified format
    const unifiedEmployeeDocuments: UnifiedDocumentView[] = employeeDocuments.map(doc => {
      return {
        ...doc,
        DocumentID: doc.ID || doc.DocumentID || 0, // Map ID to DocumentID for consistency
        DocumentType: 'employee' as const
      };
    });

    // Convert training documents to unified format
    const unifiedTrainingDocuments: UnifiedDocumentView[] = trainingDocuments.map(doc => {
      return {
        EmployeeID: 0, // Training documents don't belong to specific employees
        FullName: 'Training Document',
        DocumentID: doc.DocumentID || 0, // Use DocumentID from training documents
        FileName: doc.FileName,
        FilePath: doc.FilePath,
        Description: doc.Description,
        UploadedAt: doc.UploadedAt,
        UploadedByID: doc.UploadedByID,
        UploadedBy: doc.UploadedBy,
        CategoryID: doc.CategoryID,
        Category: doc.Category,
        Tags: doc.Tags,
        DocumentType: 'training' as const,
        TrainingID: doc.TrainingID,
        TrainingName: doc.TrainingName
      };
    });

    // Combine both arrays
    const allDocuments = [...unifiedEmployeeDocuments, ...unifiedTrainingDocuments];
    
    return allDocuments;
  } catch (error) {
    console.error('Error fetching unified documents:', error);
    // Fallback to just employee documents if training documents fail
    const employeeDocuments = await fetchAllDocuments();
    return employeeDocuments.map(doc => ({
      ...doc,
      DocumentType: 'employee' as const
    }));
  }
}

// Hook to fetch all unified documents (employee + training)
export function useAllUnifiedDocuments() {
  return useQuery({
    queryKey: ['all-unified-documents'],
    queryFn: fetchAllUnifiedDocuments,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch training documents
export function useTrainingDocuments() {
  return useQuery({
    queryKey: ['training-documents'],
    queryFn: fetchTrainingDocuments,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}