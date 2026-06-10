// types.ts - TypeScript interfaces based on ERD schema
export interface User {
  user_id: number;
  lastname: string;
  firstname: string;
  middle_name: string;
  password: string;
  email: string;
}

export interface Category {
  category_id: number;
  category_name: string;
  description: string;
}

export interface Folder {
  folder_id: number;
  folder_name: string;
  folder_path: string;
  parent_folder_id: number | null;
  created_by: number;
  folder_type: string;
  created_at: string;
  updated_at: string;
  subfolders?: Folder[];
  creator?: User; // Include creator user details when loaded with relationship
}

export interface Document {
  doc_id: number;
  title: string;
  description?: string;
  file_path: string;
  created_by: string;
  status: 'active' | 'draft' | 'pending';
  folder_id: number | null;
  folder?: Folder;
  remarks?: string;
  physical_location?: string;
  location_id?: number | null;
  tracking_status?: 'in_storage' | 'checked_out';
  checked_out_to?: string | null;
  checked_out_at?: string | null;
  tracking_due_date?: string | null;
  ai_suggested_folder?: string;
  document_ref_id?: string;
  user?: User;
  created_at: string;
  updated_at: string;
}

// Physical location tracking
export interface Cabinet {
  name: string;
  total: number;
  checked_out: number;
}

export interface CabinetFolder {
  folder_id: number;
  folder_name: string;
  total: number;
}

export interface CabinetTreeNode {
  key: string;            // physical_location filter value ('__none__' for unassigned)
  name: string | null;    // null => "No location"
  total: number;
  checked_out: number;
  folders: CabinetFolder[];
}

// Managed hierarchical physical locations (Cabinet > Tray > Partition)
export interface LocationNode {
  id: number;
  name: string;
  parent_id: number | null;
  path: string;
  total: number;
  checked_out: number;
  folders: CabinetFolder[];
  children: LocationNode[];
}

export interface LocationTree {
  tree: LocationNode[];
  no_location: number;
}

export type LocationDropTarget =
  | { type: 'location'; locationId: number }
  | { type: 'location-folder'; locationId: number; folderId: number }
  | { type: 'folder'; folderId: number };

export interface DocumentTrackingEntry {
  id: number;
  action: 'moved' | 'checked_out' | 'checked_in';
  from_location?: string | null;
  to_location?: string | null;
  borrower?: string | null;
  due_date?: string | null;
  note?: string | null;
  performed_by: string;
  created_at: string;
}

export interface DocumentTrackingState {
  doc_id: number;
  title?: string;
  physical_location?: string | null;
  tracking_status: 'in_storage' | 'checked_out';
  checked_out_to?: string | null;
  checked_out_at?: string | null;
  due_date?: string | null;
}

export interface DocumentEmbedding {
  embedding_id: number;
  doc_id: number;
  chunk_index: number;
  chunk_text: string;
  embedding_vector: string;
  created_at: string;
}

export interface AIConversation {
  conversation_id: number;
  user_id: number;
  doc_id: number;
  started_at: string;
  ended_at: string | null;
}

export interface AIHistory {
  ai_history_id: number;
  doc_id: number;
  user_id: number;
  message_ai: string;
  question: string;
  answer: string;
  status: string;
}

export interface ActivityLogs {
  log_id: number;
  user_id: number;
  doc_id: number | null;
  activity_type: string;
  activity_time: string;
  activity_details: string | null;
}

// UI-specific interfaces
export interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onFilterClick: () => void;
}

export interface FolderCardProps {
  folder: Folder;
  onFolderClick: (folder: Folder) => void;
  documentCount: number;
  onFolderUpdated?: () => void;
}

export interface DocumentListItemProps {
  document: Document;
  folders?: Array<{ folder_id: number; folder_name: string }>;
  isHighlighted?: boolean;
  onDocumentUpdated?: () => void;
  onViewDocument?: (document: Document) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
  getDragIds?: (docId: number) => number[];
}

export interface BreadcrumbNavProps {
  currentFolder: Folder | null;
  onNavigate: (folder: Folder | null) => void;
  breadcrumbPath?: Folder[];
}

export interface DocumentFilters {
  folder_id?: number;
  year?: number;
  search_term?: string;
  status?: string;
  physical_location?: string;
  location_id?: number | string; // number, or 'none' for unassigned
}

export interface SortOptions {
  sortBy: keyof Document | keyof Folder;
  sortOrder: 'asc' | 'desc';
}

export interface MockData {
  folders: Folder[];
  documents: Document[];
  categories: Category[];
  users: User[];
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

export interface FileUploadUIProps {
  maxFileSize?: number;
  acceptedFileTypes?: string;
  onUploadSuccess?: (file: UploadedFile) => void;
  onUploadError?: (error: string) => void;
}

export interface UploadAreaProps {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onBrowseFiles: () => void;
}

export interface FilePreviewProps {
  file: UploadedFile;
}

export interface UploadActionsProps {
  isUploading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Add these interfaces to your existing types.ts file

// Request types for API calls
export interface CreateFolderRequest {
  folder_name: string;
  folder_path: string;
  folder_type: string;
  category_id?: number | null;
  parent_folder_id?: number | null;
}

export interface UpdateFolderRequest {
  folder_name?: string;
  folder_path?: string;
  folder_type?: string;
  category_id?: number | null;
  parent_folder_id?: number | null;
}

// API Response types
export interface ApiResponse<T> {
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// Error handling
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// Add this to your types/types.ts file

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File; // Keep reference to the original File object if needed
  // Add any other properties your UploadedFile type needs
}

export interface UploadActionsProps {
  isUploading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  uploadedFile?: UploadedFile | null; // Use your custom UploadedFile type
}

// If you want to keep it simple, you can also just use:
// export interface UploadActionsProps {
//   isUploading: boolean;
//   onConfirm: () => void;
//   onCancel: () => void;
//   uploadedFile?: File | null; // Use native File type
// }