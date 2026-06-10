import { Document, DocumentFilters, PaginatedResponse, Cabinet, CabinetTreeNode, LocationTree, LocationNode, DocumentTrackingEntry, DocumentTrackingState } from '../types/types';

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

  // Get paginated documents
  async getPaginatedDocuments(
    page: number = 1,
    folderId?: number,
    filters?: DocumentFilters,
    searchTerm?: string,
    perPage: number = 10
  ): Promise<PaginatedResponse<Document>> {
    const params = new URLSearchParams();
    
    params.append('paginate', 'true');
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());

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
      if (filters.physical_location) {
        params.append('physical_location', filters.physical_location);
      }
      if (filters.location_id !== undefined && filters.location_id !== null) {
        params.append('location_id', String(filters.location_id));
      }
    }

    const endpoint = params.toString() ? `/documents?${params.toString()}` : '/documents';
    return await this.apiCall<PaginatedResponse<Document>>(endpoint);
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

  // ─── Physical location tracking ──────────────────────────────────

  // List cabinets (distinct physical locations) for the sidebar, optionally scoped to a folder
  async getCabinets(folderId?: number): Promise<Cabinet[]> {
    const endpoint = folderId !== undefined && folderId !== null
      ? `/documents/cabinets?folder_id=${folderId}`
      : '/documents/cabinets';
    const result = await this.apiCall<{ success: boolean; cabinets: Cabinet[] }>(endpoint, {}, false);
    return result?.cabinets || [];
  }

  // Cabinet-first tree: each physical location with the folders that have documents there
  async getCabinetTree(): Promise<CabinetTreeNode[]> {
    const result = await this.apiCall<{ success: boolean; cabinets: CabinetTreeNode[] }>('/documents/cabinets/tree', {}, false);
    return result?.cabinets || [];
  }

  // ─── Managed physical locations (Cabinet > Tray > Partition) ──────

  async getLocationTree(): Promise<LocationTree> {
    const result = await this.apiCall<{ success: boolean; tree: LocationNode[]; no_location: number }>('/locations/tree', {}, false);
    return { tree: result?.tree || [], no_location: result?.no_location || 0 };
  }

  async createLocation(name: string, parentId?: number | null): Promise<LocationNode> {
    const result = await this.apiCall<{ success: boolean; location: LocationNode }>(
      '/locations',
      { method: 'POST', body: JSON.stringify({ name, parent_id: parentId ?? null }) },
      false
    );
    this.clearCache();
    return result.location;
  }

  async renameLocation(id: number, name: string): Promise<LocationNode> {
    const result = await this.apiCall<{ success: boolean; location: LocationNode }>(
      `/locations/${id}`,
      { method: 'PUT', body: JSON.stringify({ name }) },
      false
    );
    this.clearCache();
    return result.location;
  }

  async deleteLocation(id: number): Promise<void> {
    await this.apiCall<void>(`/locations/${id}`, { method: 'DELETE' }, false);
    this.clearCache();
  }

  async moveDocuments(documentIds: number[], locationId: number | null): Promise<number> {
    const result = await this.apiCall<{ success: boolean; moved: number }>(
      '/locations/move',
      { method: 'POST', body: JSON.stringify({ document_ids: documentIds, location_id: locationId }) },
      false
    );
    this.clearCache();
    return result.moved;
  }

  async assignFolder(documentIds: number[], folderId: number | null): Promise<number> {
    const result = await this.apiCall<{ success: boolean; moved: number }>(
      '/locations/assign-folder',
      { method: 'POST', body: JSON.stringify({ document_ids: documentIds, folder_id: folderId }) },
      false
    );
    this.clearCache();
    return result.moved;
  }

  // Get a document's current tracking state + movement history
  async getTracking(docId: number): Promise<{ current: DocumentTrackingState; history: DocumentTrackingEntry[] }> {
    const result = await this.apiCall<{ success: boolean; current: DocumentTrackingState; history: DocumentTrackingEntry[] }>(
      `/documents/${docId}/tracking`,
      {},
      false
    );
    return { current: result.current, history: result.history };
  }

  // Move a document to a new physical location
  async moveDocument(docId: number, toLocation: string, note?: string): Promise<DocumentTrackingState> {
    const result = await this.apiCall<{ success: boolean; document: DocumentTrackingState }>(
      `/documents/${docId}/tracking/move`,
      { method: 'POST', body: JSON.stringify({ to_location: toLocation, note }) },
      false
    );
    this.clearCache();
    return result.document;
  }

  // Check out a document to a borrower
  async checkOutDocument(docId: number, borrower: string, dueDate?: string, note?: string): Promise<DocumentTrackingState> {
    const result = await this.apiCall<{ success: boolean; document: DocumentTrackingState }>(
      `/documents/${docId}/tracking/check-out`,
      { method: 'POST', body: JSON.stringify({ borrower, due_date: dueDate || null, note }) },
      false
    );
    this.clearCache();
    return result.document;
  }

  // Check a document back in (return to storage)
  async checkInDocument(docId: number, note?: string): Promise<DocumentTrackingState> {
    const result = await this.apiCall<{ success: boolean; document: DocumentTrackingState }>(
      `/documents/${docId}/tracking/check-in`,
      { method: 'POST', body: JSON.stringify({ note }) },
      false
    );
    this.clearCache();
    return result.document;
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