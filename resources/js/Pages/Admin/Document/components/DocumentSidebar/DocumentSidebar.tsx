import React, { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Home,
  Loader,
  LayoutDashboard,
  Archive,
  Box,
  Files,
  PackageOpen,
  MapPinOff,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Folder as FolderType, LocationNode, LocationDropTarget } from "../../types/types";
import folderService from "../../services/folderService";
import realDocumentService from "../../services/realDocumentService";
import LocationFormModal from "../Location/LocationFormModal";
import { getDraggedDocIds, clearDraggedDocIds } from "../../utils/dragState";
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
  onLocationSelect: (locationId: number | "none", label: string, folderId?: number | null) => void;
  selectedLocationId?: number | "none" | null;
  selectedFolderId?: number | null;
  onLocationsChanged?: () => void;
  onDocumentsDropped?: (target: LocationDropTarget, ids: number[]) => void;
}

interface FolderTreeNode extends FolderType {
  children?: FolderTreeNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
}

type FormState =
  | { mode: "create-root" }
  | { mode: "create-child"; node: LocationNode }
  | { mode: "rename"; node: LocationNode }
  | null;

/* ─── Folder tree item (logical folders) ─────────────────────────── */
type DropPropsMaker = (key: string, target: LocationDropTarget) => React.HTMLAttributes<HTMLElement>;

const FolderTreeItem: React.FC<{
  folder: FolderTreeNode;
  level: number;
  currentFolder: FolderType | null;
  onFolderSelect: (folder: FolderType | null) => void;
  onToggleExpand: (folderId: number) => void;
  loadingFolders: Set<number>;
  isDashboardThemeEnabled: boolean;
  makeDropProps: DropPropsMaker;
  dragOverKey: string | null;
}> = ({ folder, level, currentFolder, onFolderSelect, onToggleExpand, loadingFolders, isDashboardThemeEnabled, makeDropProps, dragOverKey }) => {
  const isActive = currentFolder?.folder_id === folder.folder_id;
  const isLoading = loadingFolders.has(folder.folder_id);
  const dropKey = `fold-${folder.folder_id}`;
  const isDropOver = dragOverKey === dropKey;

  return (
    <div>
      <button
        onClick={() => { onToggleExpand(folder.folder_id); onFolderSelect(folder); }}
        {...makeDropProps(dropKey, { type: "folder", folderId: folder.folder_id })}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium truncate group ${
          isDropOver ? "ring-2 ring-yellow-400 ring-inset" : ""
        } ${
          isActive
            ? isDashboardThemeEnabled ? "bg-base-100 text-base-content font-semibold ring-1 ring-base-300" : "bg-green-50 text-green-700 font-semibold ring-1 ring-green-100"
            : isDashboardThemeEnabled ? "text-primary-content/80 hover:bg-primary-content/10 hover:text-primary-content" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        {isLoading ? (
          <Loader className={`w-4 h-4 animate-spin flex-shrink-0 ${isDashboardThemeEnabled ? "text-primary-content/50" : "text-gray-400"}`} />
        ) : folder.isExpanded ? (
          <ChevronDown className={`w-4 h-4 flex-shrink-0 ${isDashboardThemeEnabled ? "text-primary-content/50" : "text-gray-400"}`} />
        ) : (
          <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isDashboardThemeEnabled ? "text-primary-content/50" : "text-gray-400"}`} />
        )}
        {folder.isExpanded ? (
          <FolderOpen className={`w-4 h-4 flex-shrink-0 ${isActive ? (isDashboardThemeEnabled ? "text-secondary" : "text-green-600") : (isDashboardThemeEnabled ? "text-accent" : "text-blue-400")}`} />
        ) : (
          <Folder className={`w-4 h-4 flex-shrink-0 ${isActive ? (isDashboardThemeEnabled ? "text-secondary" : "text-green-600") : (isDashboardThemeEnabled ? "text-accent" : "text-blue-400")}`} />
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
              makeDropProps={makeDropProps}
              dragOverKey={dragOverKey}
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
  onLocationSelect,
  selectedLocationId = null,
  selectedFolderId = null,
  onLocationsChanged,
  onDocumentsDropped,
}) => {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const makeDropProps: DropPropsMaker = (key, target) => ({
    onDragOver: (e) => {
      if (getDraggedDocIds().length === 0) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragOverKey !== key) setDragOverKey(key);
    },
    onDragLeave: () => setDragOverKey((prev) => (prev === key ? null : prev)),
    onDrop: (e) => {
      e.preventDefault();
      setDragOverKey(null);
      const ids = getDraggedDocIds();
      if (ids.length > 0) onDocumentsDropped?.(target, ids);
      clearDraggedDocIds();
    },
  });

  // Location (cabinet) tree state
  const [tree, setTree] = useState<LocationNode[]>([]);
  const [noLocation, setNoLocation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [form, setForm] = useState<FormState>(null);
  const [deleteTarget, setDeleteTarget] = useState<LocationNode | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Folder tree state
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [loadingFolders, setLoadingFolders] = useState<Set<number>>(new Set());

  const loadTree = async () => {
    try {
      const res = await realDocumentService.getLocationTree();
      setTree(res.tree);
      setNoLocation(res.no_location);
    } catch (error) {
      console.error("Error loading locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRootFolders = async () => {
    try {
      const folders = await folderService.getFoldersByParent(null);
      setFolderTree(folders.map((folder) => ({ ...folder, isExpanded: false, isLoading: false, children: [] })));
    } catch (error) {
      console.error("Error loading root folders:", error);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadTree();
    loadRootFolders();
  }, [refreshTrigger]);

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandFolder = async (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
      setLoadingFolders((prev) => new Set([...prev, folderId]));
      try {
        const children = await folderService.getFoldersByParent(folderId);
        const childNodes: FolderTreeNode[] = children.map((folder) => ({ ...folder, isExpanded: false, isLoading: false, children: [] }));
        setFolderTree((prevTree) => prevTree.map((folder) => (folder.folder_id === folderId ? { ...folder, children: childNodes } : folder)));
      } catch (error) {
        console.error("Error loading subfolder:", error);
      } finally {
        setLoadingFolders((prev) => {
          const n = new Set(prev);
          n.delete(folderId);
          return n;
        });
      }
    }
    setExpandedFolders(newExpanded);
  };

  const updateTreeExpanded = (nodes: FolderTreeNode[]): FolderTreeNode[] =>
    nodes.map((folder) => ({
      ...folder,
      isExpanded: expandedFolders.has(folder.folder_id),
      children: folder.children ? updateTreeExpanded(folder.children) : [],
    }));

  const updatedFolderTree = updateTreeExpanded(folderTree);

  const afterChange = async () => {
    await loadTree();
    onLocationsChanged?.();
  };

  const handleFormSubmit = async (name: string) => {
    if (!form) return;
    if (form.mode === "create-root") {
      await realDocumentService.createLocation(name, null);
    } else if (form.mode === "create-child") {
      await realDocumentService.createLocation(name, form.node.id);
      setExpanded((prev) => new Set(prev).add(form.node.id));
    } else if (form.mode === "rename") {
      await realDocumentService.renameLocation(form.node.id, name);
    }
    await afterChange();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await realDocumentService.deleteLocation(deleteTarget.id);
      setDeleteTarget(null);
      await afterChange();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete location");
    } finally {
      setDeleting(false);
    }
  };

  const isAllActive = selectedLocationId == null && !currentFolder;

  const countBadge = (count: number, active: boolean) => (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
        active
          ? isDashboardThemeEnabled ? "bg-base-200 text-base-content" : "bg-green-100 text-green-700"
          : isDashboardThemeEnabled ? "bg-primary-content/10 text-primary-content/70" : "bg-gray-100 text-gray-500"
      }`}
    >
      {count}
    </span>
  );

  const renderNode = (node: LocationNode, depth: number): React.ReactNode => {
    const isOpen = expanded.has(node.id);
    const filesActive = selectedLocationId === node.id && selectedFolderId == null;
    const locKey = `loc-${node.id}`;
    return (
      <div key={node.id}>
        <div className="group relative flex items-center">
          <button
            onClick={() => toggle(node.id)}
            {...makeDropProps(locKey, { type: "location", locationId: node.id })}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
              dragOverKey === locKey ? "ring-2 ring-yellow-400 ring-inset" : ""
            } ${
              isDashboardThemeEnabled ? "text-primary-content/85 hover:bg-primary-content/10 hover:text-primary-content" : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            }`}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
            title={node.path}
          >
            {isOpen ? (
              <ChevronDown className={`w-4 h-4 flex-shrink-0 ${isDashboardThemeEnabled ? "text-primary-content/50" : "text-gray-400"}`} />
            ) : (
              <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isDashboardThemeEnabled ? "text-primary-content/50" : "text-gray-400"}`} />
            )}
            {depth === 0 ? (
              <Archive className={`w-4 h-4 flex-shrink-0 ${isDashboardThemeEnabled ? "text-secondary" : "text-yellow-500"}`} />
            ) : (
              <Box className={`w-4 h-4 flex-shrink-0 ${isDashboardThemeEnabled ? "text-secondary" : "text-yellow-500"}`} />
            )}
            <span className="truncate flex-1 text-left">{node.name}</span>
            {node.checked_out > 0 && (
              <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700" title={`${node.checked_out} checked out`}>
                <PackageOpen className="w-3 h-3" />
                {node.checked_out}
              </span>
            )}
            {countBadge(node.total, false)}
          </button>

          {/* Hover actions */}
          <div className={`absolute right-1 hidden items-center gap-0.5 rounded-lg px-1 py-0.5 group-hover:flex ${isDashboardThemeEnabled ? "bg-primary/90" : "bg-white shadow-sm border border-gray-100"}`}>
            <button onClick={(e) => { e.stopPropagation(); setForm({ mode: "create-child", node }); }} className={`rounded p-1 ${isDashboardThemeEnabled ? "text-primary-content hover:bg-primary-content/20" : "text-gray-500 hover:bg-gray-100 hover:text-green-700"}`} title="Add sub-location">
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setForm({ mode: "rename", node }); }} className={`rounded p-1 ${isDashboardThemeEnabled ? "text-primary-content hover:bg-primary-content/20" : "text-gray-500 hover:bg-gray-100 hover:text-green-700"}`} title="Rename">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setDeleteError(null); setDeleteTarget(node); }} className={`rounded p-1 ${isDashboardThemeEnabled ? "text-primary-content hover:bg-error/40" : "text-gray-500 hover:bg-red-50 hover:text-red-600"}`} title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="space-y-1">
            <button
              onClick={() => onLocationSelect(node.id, node.path)}
              {...makeDropProps(`locall-${node.id}`, { type: "location", locationId: node.id })}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                dragOverKey === `locall-${node.id}` ? "ring-2 ring-yellow-400 ring-inset" : ""
              } ${
                filesActive
                  ? isDashboardThemeEnabled ? "bg-base-100 text-base-content font-semibold ring-1 ring-base-300" : "bg-green-50 text-green-700 font-semibold ring-1 ring-green-100"
                  : isDashboardThemeEnabled ? "text-primary-content/75 hover:bg-primary-content/10 hover:text-primary-content" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
              style={{ paddingLeft: `${(depth + 1) * 16 + 12}px` }}
            >
              <Files className={`w-4 h-4 flex-shrink-0 ${filesActive ? (isDashboardThemeEnabled ? "text-secondary" : "text-green-600") : (isDashboardThemeEnabled ? "text-accent" : "text-blue-400")}`} />
              <span className="truncate flex-1 text-left">All files</span>
              {countBadge(node.total, filesActive)}
            </button>

            {/* Folders that have files in this location */}
            {node.folders.map((f) => {
              const folderActive = selectedLocationId === node.id && selectedFolderId === f.folder_id;
              const lfKey = `locfold-${node.id}-${f.folder_id}`;
              return (
                <button
                  key={`${node.id}-f${f.folder_id}`}
                  onClick={() => onLocationSelect(node.id, `${node.name} / ${f.folder_name}`, f.folder_id)}
                  {...makeDropProps(lfKey, { type: "location-folder", locationId: node.id, folderId: f.folder_id })}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                    dragOverKey === lfKey ? "ring-2 ring-yellow-400 ring-inset" : ""
                  } ${
                    folderActive
                      ? isDashboardThemeEnabled ? "bg-base-100 text-base-content font-semibold ring-1 ring-base-300" : "bg-green-50 text-green-700 font-semibold ring-1 ring-green-100"
                      : isDashboardThemeEnabled ? "text-primary-content/75 hover:bg-primary-content/10 hover:text-primary-content" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  style={{ paddingLeft: `${(depth + 1) * 16 + 12}px` }}
                  title={f.folder_name}
                >
                  <Folder className={`w-4 h-4 flex-shrink-0 ${folderActive ? (isDashboardThemeEnabled ? "text-secondary" : "text-green-600") : (isDashboardThemeEnabled ? "text-accent" : "text-blue-400")}`} />
                  <span className="truncate flex-1 text-left">{f.folder_name}</span>
                  {countBadge(f.total, folderActive)}
                </button>
              );
            })}

            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (collapsed) {
    return (
      <div className={`h-full w-16 flex flex-col items-center py-4 gap-2 shadow-sm ${isDashboardThemeEnabled ? "bg-base-100 border-r border-base-300" : "bg-white border-r border-gray-200"}`}>
        <button
          onClick={() => onToggleCollapse?.(false)}
          className={`p-2.5 rounded-lg transition-all border ${isDashboardThemeEnabled ? "bg-base-200 hover:bg-base-300 text-primary border-base-300" : "bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200"}`}
          title="Expand sidebar"
        >
          <Archive className="w-5 h-5" />
        </button>
      </div>
    );
  }

  const sectionHeader = (label: string) => (
    <div className={`px-3 pt-3 pb-1 text-xs font-bold uppercase tracking-wider ${isDashboardThemeEnabled ? "text-primary-content/55" : "text-gray-400"}`}>
      {label}
    </div>
  );

  return (
    <div className={`h-full w-72 flex flex-col overflow-hidden shadow-sm ${isDashboardThemeEnabled ? "bg-gradient-to-b from-primary via-primary to-secondary border-r border-primary-content/10 text-primary-content" : "bg-white border-r border-gray-200"}`}>
      <div className={`px-4 py-4 border-b ${isDashboardThemeEnabled ? "border-primary-content/10" : "border-gray-100"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-bold text-lg flex items-center gap-2 ${isDashboardThemeEnabled ? "text-primary-content" : "text-gray-800"}`}>
            <Archive className={`w-5 h-5 ${isDashboardThemeEnabled ? "text-secondary" : "text-yellow-500"}`} />
            Explorer
          </h3>
          <button
            onClick={() => onToggleCollapse?.(true)}
            className={`p-1.5 rounded-lg transition-all ${isDashboardThemeEnabled ? "text-primary-content/60 hover:bg-primary-content/10 hover:text-primary-content" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
            title="Collapse sidebar"
          >
            <ChevronDown className="w-5 h-5 rotate-90" />
          </button>
        </div>

        <Link
          href="/admin/dashboard"
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border group mb-2 ${isDashboardThemeEnabled ? "text-primary-content/85 hover:text-primary-content hover:bg-primary-content/10 border-primary-content/10 hover:border-primary-content/20" : "text-gray-600 hover:text-green-700 hover:bg-green-50 border-transparent hover:border-green-100"}`}
        >
          <LayoutDashboard className={`w-4 h-4 ${isDashboardThemeEnabled ? "group-hover:text-secondary" : "group-hover:text-green-600"}`} />
          <span>Back to Dashboard</span>
        </Link>

        <button
          onClick={() => setForm({ mode: "create-root" })}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${isDashboardThemeEnabled ? "bg-secondary text-secondary-content hover:bg-secondary/90" : "bg-green-700 text-white hover:bg-green-800"}`}
        >
          <Plus className="w-4 h-4" />
          New Cabinet
        </button>
      </div>

      <div data-lenis-prevent className="flex-1 overflow-y-auto custom-scrollbar px-2 py-3 space-y-1">
        <button
          onClick={() => onFolderSelect(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
            isAllActive
              ? isDashboardThemeEnabled ? "bg-base-100 text-base-content font-semibold ring-1 ring-base-300" : "bg-green-50 text-green-700 font-semibold ring-1 ring-green-100"
              : isDashboardThemeEnabled ? "text-primary-content/80 hover:bg-primary-content/10 hover:text-primary-content" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Home className={`w-4 h-4 flex-shrink-0 ${isAllActive && !isDashboardThemeEnabled ? "fill-current" : ""}`} />
          <span className="truncate">All Folders</span>
        </button>

        {/* ─── Cabinets (physical locations) ─── */}
        {sectionHeader("Cabinets")}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader className={`w-5 h-5 animate-spin ${isDashboardThemeEnabled ? "text-secondary" : "text-green-600"}`} />
          </div>
        ) : (
          <>
            {tree.length === 0 ? (
              <p className={`px-3 py-2 text-xs ${isDashboardThemeEnabled ? "text-primary-content/45" : "text-gray-400"}`}>No cabinets yet — click “New Cabinet”.</p>
            ) : (
              tree.map((node) => renderNode(node, 0))
            )}

            {noLocation > 0 && (
              <button
                onClick={() => onLocationSelect("none", "No location")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                  selectedLocationId === "none"
                    ? isDashboardThemeEnabled ? "bg-base-100 text-base-content font-semibold ring-1 ring-base-300" : "bg-green-50 text-green-700 font-semibold ring-1 ring-green-100"
                    : isDashboardThemeEnabled ? "text-primary-content/75 hover:bg-primary-content/10 hover:text-primary-content" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
                style={{ paddingLeft: "12px" }}
              >
                <MapPinOff className={`w-4 h-4 flex-shrink-0 ${isDashboardThemeEnabled ? "text-primary-content/50" : "text-gray-400"}`} />
                <span className="truncate flex-1 text-left">No location</span>
                {countBadge(noLocation, selectedLocationId === "none")}
              </button>
            )}
          </>
        )}

        {/* ─── Folders ─── */}
        {sectionHeader("Folders")}
        {updatedFolderTree.length === 0 ? (
          <p className={`px-3 py-2 text-xs ${isDashboardThemeEnabled ? "text-primary-content/45" : "text-gray-400"}`}>No folders yet</p>
        ) : (
          updatedFolderTree.map((folder) => (
            <FolderTreeItem
              key={folder.folder_id}
              folder={folder}
              level={0}
              currentFolder={currentFolder}
              onFolderSelect={onFolderSelect}
              onToggleExpand={expandFolder}
              loadingFolders={loadingFolders}
              isDashboardThemeEnabled={isDashboardThemeEnabled}
              makeDropProps={makeDropProps}
              dragOverKey={dragOverKey}
            />
          ))
        )}
      </div>

      {/* Create / rename modal */}
      <LocationFormModal
        isOpen={form !== null}
        title={form?.mode === "rename" ? "Rename location" : form?.mode === "create-child" ? `Add inside ${form.node.name}` : "New cabinet"}
        label={form?.mode === "rename" ? "Location name" : form?.mode === "create-child" ? "Sub-location name" : "Cabinet name"}
        initialValue={form?.mode === "rename" ? form.node.name : ""}
        confirmText={form?.mode === "rename" ? "Save" : "Create"}
        onSubmit={handleFormSubmit}
        onClose={() => setForm(null)}
      />

      {/* Delete confirm */}
      {deleteTarget && createPortal(
        <div data-theme={isDashboardThemeEnabled ? theme : undefined} className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className={`relative w-full max-w-sm overflow-hidden rounded-xl shadow-2xl ${isDashboardThemeEnabled ? "border border-base-300 bg-base-100 text-base-content" : "bg-white"}`} onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-full bg-red-100 p-2"><Trash2 className="h-5 w-5 text-red-600" /></div>
                <h3 className="text-base font-bold">Delete location?</h3>
              </div>
              <p className={`text-sm ${isDashboardThemeEnabled ? "text-base-content/70" : "text-gray-600"}`}>
                Delete <span className="font-semibold">{deleteTarget.name}</span>? You can only delete locations that have no sub-locations and no files.
              </p>
              {deleteError && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {deleteError}
                </div>
              )}
            </div>
            <div className={`flex justify-end gap-2 px-5 py-4 ${isDashboardThemeEnabled ? "bg-base-200/40" : "bg-gray-50"}`}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className={`rounded-lg px-4 py-2 text-sm font-medium ${isDashboardThemeEnabled ? "border border-base-300 hover:bg-base-300" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {deleting ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>,
        window.document.body
      )}
    </div>
  );
};

export default DocumentSidebar;
