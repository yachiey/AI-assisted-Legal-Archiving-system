import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Loader, AlertCircle } from 'lucide-react';
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from '../../../../../hooks/useDashboardTheme';

interface LocationFormModalProps {
  isOpen: boolean;
  title: string;
  label: string;
  initialValue?: string;
  confirmText?: string;
  onSubmit: (name: string) => Promise<void> | void;
  onClose: () => void;
}

const LocationFormModal: React.FC<LocationFormModalProps> = ({
  isOpen,
  title,
  label,
  initialValue = '',
  confirmText = 'Save',
  onSubmit,
  onClose,
}) => {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
  const [name, setName] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialValue);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a name.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(name.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      data-theme={isDashboardThemeEnabled ? theme : undefined}
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-xl shadow-2xl ${
          isDashboardThemeEnabled ? 'border border-base-300 bg-base-100 text-base-content' : 'border border-gray-200 bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-5 text-white"
          style={isDashboardThemeEnabled ? undefined : { background: 'linear-gradient(135deg, #00491e 0%, #003a18 100%)' }}
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <h3 className="text-base font-bold">{title}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {error && (
            <div className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm ${isDashboardThemeEnabled ? 'border-error/20 bg-error/10 text-error' : 'border-red-200 bg-red-50 text-red-700'}`}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <label className={`block text-sm font-medium ${isDashboardThemeEnabled ? 'text-base-content/80' : 'text-gray-700'}`}>{label}</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            placeholder="e.g., Cabinet B, Mid Tray, Partition 1"
            className={`w-full rounded-lg border px-4 py-2 transition-all focus:outline-none focus:ring-2 ${
              isDashboardThemeEnabled
                ? 'border-base-300 bg-base-100 text-base-content placeholder-base-content/40 focus:border-primary focus:ring-primary'
                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500'
            }`}
          />
        </div>

        <div className={`flex justify-end gap-2 px-5 py-4 ${isDashboardThemeEnabled ? 'bg-base-200/40' : 'bg-gray-50'}`}>
          <button
            onClick={onClose}
            disabled={submitting}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${isDashboardThemeEnabled ? 'border border-base-300 hover:bg-base-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 ${isDashboardThemeEnabled ? 'bg-primary hover:bg-primary/90' : 'bg-green-700 hover:bg-green-800'}`}
          >
            {submitting ? <Loader className="h-4 w-4 animate-spin" /> : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    window.document.body
  );
};

export default LocationFormModal;
