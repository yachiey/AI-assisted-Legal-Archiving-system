// folderService.ts - Folder API service for Laravel backend
import { Folder, CreateFolderRequest, UpdateFolderRequest, User, Category } from '../types/types';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;

class FolderService {
  private apiUrl = `${API_BASE_URL}/folders`;

  // Helper method for API calls - Updated to use Bearer token authentication
  private async apiCall<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    // Get token from localStorage (consistent with AddFolderModal)
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

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'same-origin',
    };

    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Handle unauthorized - redirect to login or show auth error
          throw new Error('Authentication required. Please log in.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Handle empty responses (like DELETE operations that return 204)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null as T;
      }

      // Check if response has content before trying to parse JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        return text ? JSON.parse(text) : null as T;
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  // Get all folders
  async getAllFolders(): Promise<Folder[]> {
    return await this.apiCall<Folder[]>('');
  }

  // Get folder by ID
  async getFolderById(folderId: number): Promise<Folder> {
    return await this.apiCall<Folder>(`/${folderId}`);
  }

  // Get folders by parent ID
  async getFoldersByParent(parentId: number | null = null): Promise<Folder[]> {
    if (parentId === null) {
      // Get root folders only (exclude all subfolders)
      const folders = await this.getAllFolders();
      const rootFolders = folders.filter(folder => !folder.parent_folder_id);
      return rootFolders;
    }
    // Use dedicated API endpoint for subfolders with cache busting
    const timestamp = Date.now();
    return await this.apiCall<Folder[]>(`/${parentId}/subfolders?_t=${timestamp}`);
  }

  // Search folders - now uses dedicated API endpoint
  async searchFolders(searchTerm: string): Promise<Folder[]> {
    if (!searchTerm.trim()) {
      return await this.getAllFolders();
    }
    
    return await this.apiCall<Folder[]>(`/search/${encodeURIComponent(searchTerm)}`);
  }

  // Get paginated folders
  async getPaginatedFolders(
    page: number = 1,
    parentId: number | null = null,
    search: string = '',
    perPage: number = 10
  ): Promise<{ data: Folder[], current_page: number, last_page: number, total: number }> {
    let queryParams = `?page=${page}&per_page=${perPage}`;
    if (parentId !== null) {
      queryParams += `&parent_id=${parentId}`;
    }
    if (search) {
      queryParams += `&search=${encodeURIComponent(search)}`;
    }
    
    const timestamp = Date.now();
    queryParams += `&_t=${timestamp}`;
    
    return await this.apiCall<any>(`/paginated${queryParams}`);
  }

  // Create new folder
  async createFolder(folderData: CreateFolderRequest): Promise<Folder> {
    return await this.apiCall<{ message: string; folder: Folder }>('', {
      method: 'POST',
      body: JSON.stringify(folderData),
    }).then(response => response.folder);
  }

  // Update folder
  async updateFolder(folderId: number, folderData: UpdateFolderRequest): Promise<Folder> {
    return await this.apiCall<Folder>(`/${folderId}`, {
      method: 'PUT',
      body: JSON.stringify(folderData),
    });
  }

  // Delete folder
  async deleteFolder(folderId: number): Promise<void> {
    await this.apiCall<void>(`/${folderId}`, {
      method: 'DELETE',
    });
  }

  // Get total folders count
  async getTotalFoldersCount(): Promise<number> {
    const folders = await this.getAllFolders();
    return folders.length;
  }

  // Sort folders (client-side utility)
  sortFolders(
    folders: Folder[], 
    sortBy: keyof Folder = 'updated_at', 
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Folder[] {
    return [...folders].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aValue = new Date(aValue as string) as any;
        bValue = new Date(bValue as string) as any;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase() as any;
        bValue = (bValue as string).toLowerCase() as any;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  // Build breadcrumb path
  async buildBreadcrumbPath(folderId: number): Promise<Folder[]> {
    const path: Folder[] = [];
    let currentFolder = await this.getFolderById(folderId);
    
    while (currentFolder) {
      path.unshift(currentFolder);
      currentFolder = currentFolder.parent_folder_id ? 
        await this.getFolderById(currentFolder.parent_folder_id) : undefined;
    }
    
    return path;
  }

  // Get recent folders - now uses dedicated API endpoint
  async getRecentFolders(limit: number = 5): Promise<Folder[]> {
    return await this.apiCall<Folder[]>(`/recent/${limit}`);
  }

  // Client-side validation (you can also use this before API calls)
  validateFolder(folder: Partial<CreateFolderRequest>): string[] {
    const errors: string[] = [];

    if (!folder.folder_name?.trim()) {
      errors.push('Folder name is required');
    }

    if (!folder.folder_path?.trim()) {
      errors.push('Folder path is required');
    }

    if (folder.folder_type && !['system', 'regular', 'shared', 'private'].includes(folder.folder_type)) {
      errors.push('Invalid folder type');
    }

    return errors;
  }

  // Utility method to get folder tree structure - now uses dedicated API endpoint
  async getFolderTree(): Promise<Folder[]> {
    return await this.apiCall<Folder[]>('/tree');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem("auth_token");
  }

  // Clear authentication (for logout)
  clearAuth(): void {
    localStorage.removeItem("auth_token");
  }
}

// Export singleton instance
export const folderService = new FolderService();
export default folderService;