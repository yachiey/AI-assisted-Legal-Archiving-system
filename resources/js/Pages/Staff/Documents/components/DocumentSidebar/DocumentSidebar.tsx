import React, { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Home,
  Loader,
  LayoutDashboard,
} from "lucide-react";
import { Folder as FolderType } from "../../types/types";
import folderService from "../../services/folderService";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../hooks/useDashboardTheme";

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
  isDashboardThemeEnabled: boolean;
}> = ({
  folder,
  level,
  currentFolder,
  onFolderSelect,
  onToggleExpand,
  loadingFolders,
  isDashboardThemeEnabled,
}) => {
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
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium truncate group ${
          isActive
            ? isDashboardThemeEnabled
              ? "bg-base-100 text-base-content font-semibold ring-1 ring-base-300"
              : "bg-green-50 text-green-700 font-semibold ring-1 ring-green-100"
            : isDashboardThemeEnabled
              ? "text-primary-content/80 hover:bg-primary-content/10 hover:text-primary-content"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
        style={{
          paddingLeft: `${level * 16 + 12}px`,
        }}
      >
        {isLoading ? (
          <Loader
            className={`w-4 h-4 animate-spin flex-shrink-0 ${
              isDashboardThemeEnabled ? "text-primary-content/50" : "text-gray-400"
            }`}
          />
        ) : folder.isExpanded ? (
          <ChevronDown
            className={`w-4 h-4 flex-shrink-0 ${
              isDashboardThemeEnabled ? "text-primary-content/50" : "text-gray-400"
            }`}
          />
        ) : (
          <ChevronRight
            className={`w-4 h-4 flex-shrink-0 ${
              isDashboardThemeEnabled ? "text-primary-content/50" : "text-gray-400"
            }`}
          />
        )}

        {folder.isExpanded ? (
          <FolderOpen
            className={`w-4 h-4 flex-shrink-0 ${
              isActive
                ? isDashboardThemeEnabled
                  ? "text-secondary"
                  : "text-green-600"
                : isDashboardThemeEnabled
                  ? "text-accent"
                  : "text-blue-400"
            }`}
          />
        ) : (
          <Folder
            className={`w-4 h-4 flex-shrink-0 ${
              isActive
                ? isDashboardThemeEnabled
                  ? "text-secondary"
                  : "text-green-600"
                : isDashboardThemeEnabled
                  ? "text-accent"
                  : "text-blue-400"
            }`}
          />
        )}

        <span className="truncate">{folder.folder_name}</span>
      </button>

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
              isDashboardThemeEnabled={isDashboardThemeEnabled}
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
  const { theme } = useDashboardTheme("staff");
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [loadingFolders, setLoadingFolders] = useState<Set<number>>(new Set());
  const [initialLoading, setInitialLoading] = useState(true);

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
        console.error("Error loading root folders:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadRootFolders();
  }, [refreshTrigger]);

  const expandFolder = async (folderId: number) => {
    const newExpanded = new Set(expandedFolders);

    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
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

        setFolderTree((prevTree) =>
          prevTree.map((folder) => {
            if (folder.folder_id === folderId) {
              return { ...folder, children: childNodes };
            }
            return folder;
          })
        );
      } catch (error) {
        console.error("Error loading subfolder:", error);
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
      <div
        className={`h-full w-16 flex flex-col items-center py-4 gap-2 shadow-sm ${
          isDashboardThemeEnabled
            ? "bg-base-100 border-r border-base-300"
            : "bg-white border-r border-gray-200"
        }`}
      >
        <button
          onClick={() => onToggleCollapse?.(false)}
          className={`p-2.5 rounded-lg transition-all border ${
            isDashboardThemeEnabled
              ? "bg-base-200 hover:bg-base-300 text-primary border-base-300"
              : "bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200"
          }`}
          title="Expand sidebar"
        >
          <FolderOpen className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`h-full w-72 flex flex-col overflow-hidden shadow-sm ${
        isDashboardThemeEnabled
          ? "bg-gradient-to-b from-primary via-primary to-secondary border-r border-primary-content/10 text-primary-content"
          : "bg-white border-r border-gray-200"
      }`}
    >
      <div
        className={`px-4 py-4 border-b ${
          isDashboardThemeEnabled
            ? "border-primary-content/10"
            : "border-gray-100"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`font-bold text-lg flex items-center gap-2 ${
              isDashboardThemeEnabled ? "text-primary-content" : "text-gray-800"
            }`}
          >
            <Folder
              className={`w-5 h-5 ${
                isDashboardThemeEnabled ? "text-secondary" : "text-green-600"
              }`}
            />
            Explorer
          </h3>
          <button
            onClick={() => onToggleCollapse?.(true)}
            className={`p-1.5 rounded-lg transition-all ${
              isDashboardThemeEnabled
                ? "text-primary-content/60 hover:bg-primary-content/10 hover:text-primary-content"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            }`}
            title="Collapse sidebar"
          >
            <ChevronDown className="w-5 h-5 rotate-90" />
          </button>
        </div>

        <Link
          href="/staff/dashboard"
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border group mb-2 ${
            isDashboardThemeEnabled
              ? "text-primary-content/85 hover:text-primary-content hover:bg-primary-content/10 border-primary-content/10 hover:border-primary-content/20"
              : "text-gray-600 hover:text-green-700 hover:bg-green-50 border-transparent hover:border-green-100"
          }`}
        >
          <LayoutDashboard
            className={`w-4 h-4 ${
              isDashboardThemeEnabled
                ? "group-hover:text-secondary"
                : "group-hover:text-green-600"
            }`}
          />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-3 space-y-1">
        <button
          onClick={() => onFolderSelect(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
            !currentFolder
              ? isDashboardThemeEnabled
                ? "bg-base-100 text-base-content font-semibold ring-1 ring-base-300"
                : "bg-green-50 text-green-700 font-semibold ring-1 ring-green-100"
              : isDashboardThemeEnabled
                ? "text-primary-content/80 hover:bg-primary-content/10 hover:text-primary-content"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Home
            className={`w-4 h-4 flex-shrink-0 ${
              !currentFolder && !isDashboardThemeEnabled ? "fill-current" : ""
            }`}
          />
          <span className="truncate">All Folders</span>
        </button>

        {initialLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader
              className={`w-5 h-5 animate-spin ${
                isDashboardThemeEnabled ? "text-secondary" : "text-green-600"
              }`}
            />
          </div>
        ) : updatedTree.length === 0 ? (
          <div className="text-center py-6">
            <p
              className={`text-sm ${
                isDashboardThemeEnabled
                  ? "text-primary-content/55"
                  : "text-gray-400"
              }`}
            >
              No folders yet
            </p>
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
              isDashboardThemeEnabled={isDashboardThemeEnabled}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default DocumentSidebar;


