// realDocumentService.ts - Real document service that connects to Laravel backend
import { Document, DocumentFilters } from '../types/types';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;

class RealDocumentService {
  private apiUrl = API_BASE_URL;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  // Simple cache helper
  private getCacheKey(endpoint: string): string {
    return endpoint;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Helper method for API calls
  async apiCall<T>(
    endpoint: string,
    options: RequestInit = {},
    useCache = true
  ): Promise<T> {
    // Get token from localStorage
    const token = localStorage.getItem("auth_token");

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    // Use Bearer token authentication if token exists
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Add CSRF token for security
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      defaultHeaders['X-CSRF-TOKEN'] = csrfToken;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'same-origin',
    };

    // Check cache for GET requests
    const cacheKey = this.getCacheKey(endpoint);
    if (useCache && (!options.method || options.method === 'GET')) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, config);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }

        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Handle empty responses
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null as T;
      }

      // Check if response has content before trying to parse JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        return text ? JSON.parse(text) : null as T;
      }

      const result = await response.json();

      // Cache successful GET responses
      if (useCache && (!options.method || options.method === 'GET')) {
        this.setCache(cacheKey, result);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`API Error [${endpoint}]:`, errorMessage);
      throw error;
    }
  }


  // Get all documents with optional filtering
  async getAllDocuments(folderId?: number, filters?: DocumentFilters, searchTerm?: string): Promise<Document[]> {
    const params = new URLSearchParams();

    if (folderId !== undefined && folderId !== null) {
      params.append('folder_id', folderId.toString());
    }

    if (searchTerm) {
      params.append('search', searchTerm);
    }

    if (filters) {
      if (filters.folder_id) {
        params.append('folder_id', filters.folder_id.toString());
      }
      if (filters.year) {
        params.append('year', filters.year.toString());
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
    }

    const endpoint = params.toString() ? `/documents?${params.toString()}` : '/documents';
    return await this.apiCall<Document[]>(endpoint);
  }

  // Apply filters to documents
  async getFilteredDocuments(filters: DocumentFilters, searchTerm?: string): Promise<Document[]> {
    return await this.getAllDocuments(undefined, filters, searchTerm);
  }

  // Get document counts
  async getDocumentCounts(): Promise<{ total_documents: number; documents_by_status: Record<string, number> }> {
    return await this.apiCall<{ total_documents: number; documents_by_status: Record<string, number> }>('/documents/counts');
  }

  // Get total documents count
  async getTotalDocumentsCount(): Promise<number> {
    try {
      const counts = await this.getDocumentCounts();
      return counts.total_documents;
    } catch (error) {
      console.error('Error getting document count:', error);
      return 0;
    }
  }

  // Get documents by folder
  async getDocumentsByFolder(folderId: number): Promise<Document[]> {
    return await this.getAllDocuments(folderId);
  }

  // Get folder document count (optimized)
  async getFolderDocumentCount(folderId: number): Promise<number> {
    try {
      // Use dedicated count endpoint
      const result = await this.apiCall<{ count: number }>(`/documents/folder/${folderId}/count`);
      return result.count;
    } catch (error) {
      console.error('Error getting folder document count, falling back to document list:', error);
      // Fallback to loading documents and counting
      try {
        const documents = await this.getDocumentsByFolder(folderId);
        return documents.length;
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return 0;
      }
    }
  }

  // Get bulk folder document counts (optimized)
  async getBulkFolderCounts(folderIds: number[]): Promise<Record<number, number>> {
    if (folderIds.length === 0) return {};

    try {
      // Use bulk endpoint
      return await this.apiCall<Record<number, number>>('/documents/folders/bulk-counts', {
        method: 'POST',
        body: JSON.stringify({ folder_ids: folderIds })
      }, false); // Don't cache POST requests
    } catch (error) {
      console.error('Bulk count failed, using individual calls:', error);
      // Fallback to individual calls in parallel
      const counts: Record<number, number> = {};
      const promises = folderIds.map(async (id) => {
        counts[id] = await this.getFolderDocumentCount(id);
      });
      await Promise.all(promises);
      return counts;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem("auth_token");
  }

  // Clear authentication (for logout)
  clearAuth(): void {
    localStorage.removeItem("auth_token");
    this.cache.clear();
  }

  // Clear cache when data might be stale
  clearCache(): void {
    this.cache.clear();
  }

  // Delete document (permanently)
  async deleteDocument(documentId: number): Promise<void> {
    await this.apiCall<void>(`/documents/${documentId}`, {
      method: 'DELETE',
    }, false);
    this.clearCache(); // Clear cache after deletion
  }

  // Bulk delete documents
  async bulkDeleteDocuments(documentIds: number[]): Promise<void> {
    await this.apiCall<void>('/documents/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ document_ids: documentIds }),
    }, false);
    this.clearCache(); // Clear cache after bulk deletion
  }
}

// Export singleton instance
export const realDocumentService = new RealDocumentService();
export default realDocumentService;