import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronDown, ChevronRight, Folder, FolderOpen, Home, Loader, LayoutDashboard } from 'lucide-react';
import { Folder as FolderType } from '../../types/types';
import folderService from '../../services/folderService';

interface DocumentSidebarProps {
    currentFolder: FolderType | null;
    onFolderSelect: (folder: FolderType | null) => void;
    collapsed?: boolean;
    onToggleCollapse?: (collapsed: boolean) => void;
    refreshTrigger?: number;
}

interface FolderTreeNode extends FolderType {
    children?: FolderTreeNode[];
    isExpanded?: boolean;
    isLoading?: boolean;
}

const FolderTreeItem: React.FC<{
    folder: FolderTreeNode;
    level: number;
    currentFolder: FolderType | null;
    onFolderSelect: (folder: FolderType | null) => void;
    onToggleExpand: (folderId: number) => void;
    loadingFolders: Set<number>;
}> = ({ folder, level, currentFolder, onFolderSelect, onToggleExpand, loadingFolders }) => {
    const hasChildren = true;
    const isActive = currentFolder?.folder_id === folder.folder_id;
    const isLoading = loadingFolders.has(folder.folder_id);

    return (
        <div>
            <button
                onClick={() => {
                    if (hasChildren) {
                        onToggleExpand(folder.folder_id);
                    }
                    onFolderSelect(folder);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium truncate group ${isActive
                    ? 'bg-green-50 text-green-700 font-semibold ring-1 ring-green-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                style={{
                    paddingLeft: `${level * 16 + 12}px`,
                }}
            >
                {isLoading ? (
                    <Loader className="w-4 h-4 animate-spin flex-shrink-0 text-gray-400" />
                ) : folder.isExpanded ? (
                    <ChevronDown className="w-4 h-4 flex-shrink-0 text-gray-400" />
                ) : (
                    <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-400" />
                )}

                {folder.isExpanded ? (
                    <FolderOpen className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-green-600' : 'text-blue-400'}`} />
                ) : (
                    <Folder className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-green-600' : 'text-blue-400'}`} />
                )}

                <span className="truncate">{folder.folder_name}</span>
            </button>

            {/* Render children */}
            {folder.isExpanded && folder.children && folder.children.length > 0 && (
                <div className="space-y-1">
                    {folder.children.map((child) => (
                        <FolderTreeItem
                            key={child.folder_id}
                            folder={child}
                            level={level + 1}
                            currentFolder={currentFolder}
                            onFolderSelect={onFolderSelect}
                            onToggleExpand={onToggleExpand}
                            loadingFolders={loadingFolders}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
    currentFolder,
    onFolderSelect,
    collapsed = false,
    onToggleCollapse,
    refreshTrigger = 0,
}) => {
    const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
    const [loadingFolders, setLoadingFolders] = useState<Set<number>>(new Set());
    const [initialLoading, setInitialLoading] = useState(true);

    // Load root folders on mount
    useEffect(() => {
        const loadRootFolders = async () => {
            try {
                const folders = await folderService.getFoldersByParent(null);
                const tree: FolderTreeNode[] = folders.map((folder) => ({
                    ...folder,
                    isExpanded: false,
                    isLoading: false,
                    children: [],
                }));
                setFolderTree(tree);
            } catch (error) {
                console.error('Error loading root folders:', error);
            } finally {
                setInitialLoading(false);
            }
        };

        loadRootFolders();
    }, [refreshTrigger]);

    const expandFolder = async (folderId: number) => {
        const newExpanded = new Set(expandedFolders);

        if (newExpanded.has(folderId)) {
            // Collapse folder
            newExpanded.delete(folderId);
        } else {
            // Expand folder and load children
            newExpanded.add(folderId);
            setLoadingFolders((prev) => new Set([...prev, folderId]));

            try {
                const children = await folderService.getFoldersByParent(folderId);
                const childNodes: FolderTreeNode[] = children.map((folder) => ({
                    ...folder,
                    isExpanded: false,
                    isLoading: false,
                    children: [],
                }));

                // Update tree with children
                setFolderTree((prevTree) =>
                    prevTree.map((folder) => {
                        if (folder.folder_id === folderId) {
                            return { ...folder, children: childNodes };
                        }
                        return folder;
                    })
                );
            } catch (error) {
                console.error('Error loading subfolder:', error);
            } finally {
                setLoadingFolders((prev) => {
                    const newLoading = new Set(prev);
                    newLoading.delete(folderId);
                    return newLoading;
                });
            }
        }

        setExpandedFolders(newExpanded);
    };

    const updateTreeExpanded = (tree: FolderTreeNode[]): FolderTreeNode[] => {
        return tree.map((folder) => ({
            ...folder,
            isExpanded: expandedFolders.has(folder.folder_id),
            children: folder.children ? updateTreeExpanded(folder.children) : [],
        }));
    };

    const updatedTree = updateTreeExpanded(folderTree);

    if (collapsed) {
        return (
            <div className="h-full w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2 shadow-sm">
                <button
                    onClick={() => onToggleCollapse?.(false)}
                    className="p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition-all border border-gray-200"
                    title="Expand sidebar"
                >
                    <FolderOpen className="w-5 h-5" />
                </button>
            </div>
        );
    }

    return (
        <div className="h-full w-72 bg-white border-r border-gray-200 flex flex-col overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-4 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-800 font-bold text-lg flex items-center gap-2">
                        <Folder className="w-5 h-5 text-green-600" />
                        Explorer
                    </h3>
                    <button
                        onClick={() => onToggleCollapse?.(true)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
                        title="Collapse sidebar"
                    >
                        <ChevronDown className="w-5 h-5 rotate-90" />
                    </button>
                </div>

                {/* Back to Dashboard */}
                <Link
                    href="/admin/dashboard"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-green-700 hover:bg-green-50 transition-all border border-transparent hover:border-green-100 group mb-2"
                >
                    <LayoutDashboard className="w-4 h-4 group-hover:text-green-600" />
                    <span>Back to Dashboard</span>
                </Link>
            </div>

            {/* Folder Tree */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-3 space-y-1">
                {/* Home/Root Button */}
                <button
                    onClick={() => onFolderSelect(null)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${!currentFolder
                        ? 'bg-green-50 text-green-700 font-semibold ring-1 ring-green-100'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                >
                    <Home className={`w-4 h-4 flex-shrink-0 ${!currentFolder ? 'fill-current' : ''}`} />
                    <span className="truncate">All Folders</span>
                </button>

                {/* Folder Tree */}
                {initialLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader className="w-5 h-5 animate-spin text-green-600" />
                    </div>
                ) : updatedTree.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-gray-400 text-sm">No folders yet</p>
                    </div>
                ) : (
                    updatedTree.map((folder) => (
                        <FolderTreeItem
                            key={folder.folder_id}
                            folder={folder}
                            level={0}
                            currentFolder={currentFolder}
                            onFolderSelect={onFolderSelect}
                            onToggleExpand={expandFolder}
                            loadingFolders={loadingFolders}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default DocumentSidebar;
