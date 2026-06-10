import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Loader, AlertCircle, Archive, Box, MapPinOff, Check } from 'lucide-react';
import { LocationNode } from '../../types/types';
import realDocumentService from '../../services/realDocumentService';
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from '../../../../../hooks/useDashboardTheme';

interface MoveToLocationModalProps {
  isOpen: boolean;
  documentIds: number[];
  subtitle?: string;
  onMoved: (count: number) => void;
  onClose: () => void;
}

const MoveToLocationModal: React.FC<MoveToLocationModalProps> = ({
  isOpen,
  documentIds,
  subtitle,
  onMoved,
  onClose,
}) => {
  const { theme } = useDashboardTheme('staff');
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
  const [tree, setTree] = useState<LocationNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | 'none' | null>(null);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelected(null);
    setError(null);
    setLoading(true);
    realDocumentService
      .getLocationTree()
      .then((res) => setTree(res.tree))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load locations'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMove = async () => {
    if (selected === null) {
      setError('Please choose a destination.');
      return;
    }
    setMoving(true);
    setError(null);
    try {
      const count = await realDocumentService.moveDocuments(documentIds, selected === 'none' ? null : selected);
      onMoved(count);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move documents');
    } finally {
      setMoving(false);
    }
  };

  const renderNode = (node: LocationNode, depth: number): React.ReactNode => {
    const isSelected = selected === node.id;
    return (
      <React.Fragment key={node.id}>
        <button
          onClick={() => setSelected(node.id)}
          className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all ${
            isSelected
              ? isDashboardThemeEnabled ? 'bg-primary/15 text-primary ring-1 ring-primary/40' : 'bg-green-50 text-green-700 ring-1 ring-green-200'
              : isDashboardThemeEnabled ? 'hover:bg-base-200 text-base-content' : 'hover:bg-gray-50 text-gray-700'
          }`}
          style={{ paddingLeft: `${depth * 18 + 12}px` }}
        >
          {depth === 0 ? (
            <Archive className={`h-4 w-4 shrink-0 ${isDashboardThemeEnabled ? 'text-secondary' : 'text-yellow-500'}`} />
          ) : (
            <Box className={`h-4 w-4 shrink-0 ${isDashboardThemeEnabled ? 'text-secondary' : 'text-yellow-500'}`} />
          )}
          <span className="truncate flex-1">{node.name}</span>
          {isSelected && <Check className="h-4 w-4 shrink-0" />}
        </button>
        {node.children.map((child) => renderNode(child, depth + 1))}
      </React.Fragment>
    );
  };

  return createPortal(
    <div
      data-theme={isDashboardThemeEnabled ? theme : undefined}
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative flex w-full max-w-md flex-col overflow-hidden rounded-xl shadow-2xl ${
          isDashboardThemeEnabled ? 'border border-base-300 bg-base-100 text-base-content' : 'border border-gray-200 bg-white'
        }`}
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-5 text-white"
          style={isDashboardThemeEnabled ? undefined : { background: 'linear-gradient(135deg, #00491e 0%, #003a18 100%)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-base font-bold">Move to location</h3>
              <p className="mt-0.5 text-xs text-white/80 truncate">
                {subtitle || `${documentIds.length} ${documentIds.length === 1 ? 'document' : 'documents'} selected`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div data-lenis-prevent className="flex-1 overflow-y-auto p-4 space-y-1">
          {error && (
            <div className={`mb-2 flex items-center gap-2 rounded-lg border p-2.5 text-sm ${isDashboardThemeEnabled ? 'border-error/20 bg-error/10 text-error' : 'border-red-200 bg-red-50 text-red-700'}`}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader className={`h-6 w-6 animate-spin ${isDashboardThemeEnabled ? 'text-primary' : 'text-green-600'}`} />
            </div>
          ) : (
            <>
              {/* No location option */}
              <button
                onClick={() => setSelected('none')}
                className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all ${
                  selected === 'none'
                    ? isDashboardThemeEnabled ? 'bg-primary/15 text-primary ring-1 ring-primary/40' : 'bg-green-50 text-green-700 ring-1 ring-green-200'
                    : isDashboardThemeEnabled ? 'hover:bg-base-200 text-base-content/70' : 'hover:bg-gray-50 text-gray-500'
                }`}
                style={{ paddingLeft: '12px' }}
              >
                <MapPinOff className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1">No location (unassign)</span>
                {selected === 'none' && <Check className="h-4 w-4 shrink-0" />}
              </button>

              {tree.length === 0 ? (
                <p className={`px-3 py-4 text-sm ${isDashboardThemeEnabled ? 'text-base-content/55' : 'text-gray-400'}`}>
                  No locations yet. Create a cabinet in the sidebar first.
                </p>
              ) : (
                tree.map((node) => renderNode(node, 0))
              )}
            </>
          )}
        </div>

        <div className={`flex justify-end gap-2 px-5 py-4 ${isDashboardThemeEnabled ? 'bg-base-200/40' : 'bg-gray-50'}`}>
          <button
            onClick={onClose}
            disabled={moving}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${isDashboardThemeEnabled ? 'border border-base-300 hover:bg-base-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={moving || selected === null}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 ${isDashboardThemeEnabled ? 'bg-primary hover:bg-primary/90' : 'bg-green-700 hover:bg-green-800'}`}
          >
            {moving ? <Loader className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            Move here
          </button>
        </div>
      </div>
    </div>,
    window.document.body
  );
};

export default MoveToLocationModal;
