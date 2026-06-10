import React, { useState, useEffect } from 'react';
import {
  X, MapPin, History, ArrowRight, Clock, User, AlertCircle,
  PackageOpen, PackageCheck, MoveRight, Loader,
} from 'lucide-react';
import { Document, DocumentTrackingEntry, DocumentTrackingState } from '../../types/types';
import realDocumentService from '../../services/realDocumentService';
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from '../../../../../hooks/useDashboardTheme';

interface DocumentTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  onUpdated?: () => void;
}

type ActionTab = 'move' | 'check_out' | 'check_in' | null;

const DocumentTrackingModal: React.FC<DocumentTrackingModalProps> = ({
  isOpen,
  onClose,
  document,
  onUpdated,
}) => {
  const { theme } = useDashboardTheme('staff');
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

  const [current, setCurrent] = useState<DocumentTrackingState | null>(null);
  const [history, setHistory] = useState<DocumentTrackingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActionTab>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [toLocation, setToLocation] = useState('');
  const [borrower, setBorrower] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');

  const loadTracking = async () => {
    setLoading(true);
    try {
      const { current, history } = await realDocumentService.getTracking(document.doc_id);
      setCurrent(current);
      setHistory(history);
      setToLocation(current.physical_location || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tracking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(null);
      setError(null);
      setNote('');
      setBorrower('');
      setDueDate('');
      loadTracking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, document.doc_id]);

  if (!isOpen) return null;

  const isCheckedOut = current?.tracking_status === 'checked_out';

  const resetForms = () => {
    setActiveTab(null);
    setNote('');
    setError(null);
  };

  const afterChange = (next: DocumentTrackingState) => {
    setCurrent(next);
    setToLocation(next.physical_location || '');
    resetForms();
    loadTracking();
    onUpdated?.();
  };

  const handleMove = async () => {
    if (!toLocation.trim()) { setError('Please enter a location.'); return; }
    setSubmitting(true); setError(null);
    try {
      const next = await realDocumentService.moveDocument(document.doc_id, toLocation.trim(), note.trim() || undefined);
      afterChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move document');
    } finally { setSubmitting(false); }
  };

  const handleCheckOut = async () => {
    if (!borrower.trim()) { setError('Please enter who is borrowing the document.'); return; }
    setSubmitting(true); setError(null);
    try {
      const next = await realDocumentService.checkOutDocument(document.doc_id, borrower.trim(), dueDate || undefined, note.trim() || undefined);
      afterChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check out document');
    } finally { setSubmitting(false); }
  };

  const handleCheckIn = async () => {
    setSubmitting(true); setError(null);
    try {
      const next = await realDocumentService.checkInDocument(document.doc_id, note.trim() || undefined);
      afterChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check in document');
    } finally { setSubmitting(false); }
  };

  const formatDateTime = (value?: string | null): string => {
    if (!value) return '';
    const d = new Date(value);
    return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (value?: string | null): string => {
    if (!value) return '';
    const d = new Date(value);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const actionLabel = (action: DocumentTrackingEntry['action']): string => {
    switch (action) {
      case 'moved': return 'Moved';
      case 'checked_out': return 'Checked out';
      case 'checked_in': return 'Checked in';
      default: return action;
    }
  };

  const actionDot = (action: DocumentTrackingEntry['action']): string => {
    switch (action) {
      case 'checked_out': return 'bg-amber-500';
      case 'checked_in': return 'bg-green-600';
      default: return 'bg-blue-500';
    }
  };

  const inputClass = `w-full rounded-lg border px-4 py-2 transition-all focus:outline-none focus:ring-2 ${
    isDashboardThemeEnabled
      ? 'border-base-300 bg-base-100 text-base-content placeholder-base-content/40 focus:border-primary focus:ring-primary'
      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500'
  }`;

  const labelClass = `mb-1.5 block text-sm font-medium ${isDashboardThemeEnabled ? 'text-base-content/80' : 'text-gray-700'}`;

  return (
    <div
      data-theme={isDashboardThemeEnabled ? theme : undefined}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
    >
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative flex w-full max-w-2xl flex-col overflow-hidden rounded-xl shadow-2xl ${
          isDashboardThemeEnabled ? 'border border-base-300 bg-base-100 text-base-content' : 'border border-gray-200 bg-white'
        }`}
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 text-white"
          style={
            isDashboardThemeEnabled
              ? undefined
              : { background: 'linear-gradient(135deg, #00491e 0%, #003a18 100%)' }
          }
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-lg bg-white/15 p-2">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold truncate">Track Physical Location</h3>
              <p className="mt-0.5 text-sm text-white/80 truncate">{document.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-white/80 transition-all hover:bg-white/15 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div data-lenis-prevent className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className={`h-6 w-6 animate-spin ${isDashboardThemeEnabled ? 'text-primary' : 'text-green-600'}`} />
            </div>
          ) : (
            <>
              {error && (
                <div className={`flex items-center gap-2 rounded-lg border p-3 ${isDashboardThemeEnabled ? 'border-error/20 bg-error/10 text-error' : 'border-red-200 bg-red-50 text-red-700'}`}>
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Current status card */}
              <div className={`rounded-xl border p-4 ${isDashboardThemeEnabled ? 'border-base-300 bg-base-200/40' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MapPin className={`h-4 w-4 ${isDashboardThemeEnabled ? 'text-primary' : 'text-green-700'}`} />
                    <span className={`text-sm font-semibold ${isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'}`}>
                      {current?.physical_location || 'No location assigned'}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      isCheckedOut
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {isCheckedOut ? <PackageOpen className="h-3.5 w-3.5" /> : <PackageCheck className="h-3.5 w-3.5" />}
                    {isCheckedOut ? 'Checked Out' : 'In Storage'}
                  </span>
                </div>
                {isCheckedOut && (
                  <div className={`mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm ${isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-600'}`}>
                    <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {current?.checked_out_to}</span>
                    {current?.checked_out_at && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Out since {formatDate(current.checked_out_at)}</span>}
                    {current?.due_date && <span className="flex items-center gap-1.5 font-medium text-amber-600">Due {formatDate(current.due_date)}</span>}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {!isCheckedOut ? (
                  <button
                    onClick={() => { setActiveTab(activeTab === 'check_out' ? null : 'check_out'); setError(null); }}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                      activeTab === 'check_out'
                        ? 'bg-amber-500 text-white'
                        : (isDashboardThemeEnabled ? 'border border-base-300 hover:bg-base-200' : 'border border-gray-300 text-gray-700 hover:bg-gray-50')
                    }`}
                  >
                    <PackageOpen className="h-4 w-4" /> Check Out
                  </button>
                ) : (
                  <button
                    onClick={() => { setActiveTab(activeTab === 'check_in' ? null : 'check_in'); setError(null); }}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                      activeTab === 'check_in'
                        ? 'bg-green-600 text-white'
                        : (isDashboardThemeEnabled ? 'border border-base-300 hover:bg-base-200' : 'border border-gray-300 text-gray-700 hover:bg-gray-50')
                    }`}
                  >
                    <PackageCheck className="h-4 w-4" /> Check In
                  </button>
                )}
              </div>

              {/* Action forms */}
              {activeTab === 'move' && (
                <div className={`space-y-3 rounded-xl border p-4 ${isDashboardThemeEnabled ? 'border-base-300 bg-base-200/30' : 'border-gray-200 bg-gray-50'}`}>
                  <div>
                    <label className={labelClass}>New location <span className="text-red-500">*</span></label>
                    <input type="text" value={toLocation} onChange={(e) => setToLocation(e.target.value)} className={inputClass} placeholder="e.g., Cabinet A, Shelf 3, Box 12" />
                  </div>
                  <div>
                    <label className={labelClass}>Note (optional)</label>
                    <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder="Reason for the move" />
                  </div>
                  <div className="flex justify-end">
                    <button onClick={handleMove} disabled={submitting} className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 ${isDashboardThemeEnabled ? 'bg-primary hover:bg-primary/90' : 'bg-green-700 hover:bg-green-800'}`}>
                      {submitting ? <Loader className="h-4 w-4 animate-spin" /> : <MoveRight className="h-4 w-4" />} Save Move
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'check_out' && (
                <div className={`space-y-3 rounded-xl border p-4 ${isDashboardThemeEnabled ? 'border-base-300 bg-base-200/30' : 'border-amber-200 bg-amber-50'}`}>
                  <div>
                    <label className={labelClass}>Borrower <span className="text-red-500">*</span></label>
                    <input type="text" value={borrower} onChange={(e) => setBorrower(e.target.value)} className={inputClass} placeholder="Name of the person taking the document" />
                  </div>
                  <div>
                    <label className={labelClass}>Due date (optional)</label>
                    <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Note (optional)</label>
                    <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder="Purpose / remarks" />
                  </div>
                  <div className="flex justify-end">
                    <button onClick={handleCheckOut} disabled={submitting} className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50">
                      {submitting ? <Loader className="h-4 w-4 animate-spin" /> : <PackageOpen className="h-4 w-4" />} Confirm Check Out
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'check_in' && (
                <div className={`space-y-3 rounded-xl border p-4 ${isDashboardThemeEnabled ? 'border-base-300 bg-base-200/30' : 'border-green-200 bg-green-50'}`}>
                  <p className={`text-sm ${isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-600'}`}>
                    Returning <span className="font-semibold">{document.title}</span> to storage at <span className="font-semibold">{current?.physical_location || 'its location'}</span>.
                  </p>
                  <div>
                    <label className={labelClass}>Note (optional)</label>
                    <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder="Condition / remarks on return" />
                  </div>
                  <div className="flex justify-end">
                    <button onClick={handleCheckIn} disabled={submitting} className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                      {submitting ? <Loader className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />} Confirm Check In
                    </button>
                  </div>
                </div>
              )}

              {/* History timeline */}
              <div>
                <h4 className={`mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider ${isDashboardThemeEnabled ? 'text-base-content/50' : 'text-gray-400'}`}>
                  <History className="h-4 w-4" /> Tracking History
                </h4>
                {history.length === 0 ? (
                  <p className={`text-sm ${isDashboardThemeEnabled ? 'text-base-content/55' : 'text-gray-400'}`}>No tracking events yet.</p>
                ) : (
                  <ol className="space-y-4">
                    {history.map((entry) => (
                      <li key={entry.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span className={`mt-1 h-2.5 w-2.5 rounded-full ${actionDot(entry.action)}`} />
                          <span className={`mt-1 w-px flex-1 ${isDashboardThemeEnabled ? 'bg-base-300' : 'bg-gray-200'}`} />
                        </div>
                        <div className="flex-1 pb-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-sm font-semibold ${isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'}`}>
                              {actionLabel(entry.action)}
                            </span>
                            {entry.action === 'moved' && (
                              <span className={`flex items-center gap-1 text-xs ${isDashboardThemeEnabled ? 'text-base-content/60' : 'text-gray-500'}`}>
                                {entry.from_location || 'Unassigned'} <ArrowRight className="h-3 w-3" /> {entry.to_location}
                              </span>
                            )}
                            {entry.action === 'checked_out' && entry.borrower && (
                              <span className="text-xs text-amber-600">to {entry.borrower}{entry.due_date ? ` · due ${formatDate(entry.due_date)}` : ''}</span>
                            )}
                            {entry.action === 'checked_in' && entry.borrower && (
                              <span className="text-xs text-green-600">from {entry.borrower}</span>
                            )}
                          </div>
                          {entry.note && (
                            <p className={`mt-0.5 text-xs italic ${isDashboardThemeEnabled ? 'text-base-content/60' : 'text-gray-500'}`}>“{entry.note}”</p>
                          )}
                          <p className={`mt-0.5 text-xs ${isDashboardThemeEnabled ? 'text-base-content/45' : 'text-gray-400'}`}>
                            {formatDateTime(entry.created_at)} · {entry.performed_by}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentTrackingModal;
