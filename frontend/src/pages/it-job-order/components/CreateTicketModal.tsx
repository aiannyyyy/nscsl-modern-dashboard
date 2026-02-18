import React, { useState, useRef, useCallback } from 'react';
import type { TicketPriority } from './types';
import { useCreateJobOrder, useUploadAttachment } from '../../../hooks/ITHooks/useJobOrderHooks';
import { useAuth } from '../../../context/AuthContext';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PendingFile {
  file: File;
  previewUrl?: string;
  id: string;
}

export function CreateTicketModal({ isOpen, onClose }: CreateTicketModalProps) {
  const createJobOrderMutation = useCreateJobOrder();
  const uploadAttachmentMutation = useUploadAttachment();
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TicketPriority,
    type: '',
    category: '',
    tags: '',
  });

  React.useEffect(() => {
    if (isOpen) {
      console.log('🎫 [CREATE MODAL] Opened — user:', user);
    }
  }, [isOpen, user]);

  // ─── File Helpers ────────────────────────────────────────────────
  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const newEntries: PendingFile[] = arr.map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setPendingFiles((prev) => [...prev, ...newEntries]);
  }, []);

  const removeFile = (id: string) => {
    setPendingFiles((prev) => {
      const entry = prev.find((f) => f.id === id);
      if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('zip') || type.includes('rar')) return '🗜️';
    return '📎';
  };

  // ─── Drag & Drop ─────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  // ─── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      title: formData.title,
      description: formData.description,
      type: formData.type || formData.category.toLowerCase(),
      category: formData.category,
      priority: formData.priority,
      department: user?.department || 'Unknown',
      tags: formData.tags || undefined,
    };

    console.log('📤 [CREATE JOB ORDER] Payload:', payload);

    createJobOrderMutation.mutate(payload, {
      onSuccess: async (data) => {
        const jobOrderId = data?.data?.id;
        console.log('✅ [CREATE JOB ORDER] Created ID:', jobOrderId);

        // Upload attachments one by one if any
        if (pendingFiles.length > 0 && jobOrderId) {
          setUploadProgress(`Uploading ${pendingFiles.length} file(s)...`);
          try {
            for (let i = 0; i < pendingFiles.length; i++) {
              const { file } = pendingFiles[i];
              setUploadProgress(`Uploading file ${i + 1} of ${pendingFiles.length}: ${file.name}`);
              await uploadAttachmentMutation.mutateAsync({ id: jobOrderId, file });
              console.log(`✅ Uploaded: ${file.name}`);
            }
          } catch (uploadErr) {
            console.error('⚠️ Attachment upload failed (job order still created):', uploadErr);
          }
        }

        setUploadProgress('');
        resetForm();
        onClose();
      },
      onError: (error: any) => {
        console.error('❌ [CREATE JOB ORDER] Error:', error.response?.data);
        setUploadProgress('');
      },
    });
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', priority: 'medium', type: '', category: '', tags: '' });
    pendingFiles.forEach((f) => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); });
    setPendingFiles([]);
    setUploadProgress('');
  };

  const handleClose = () => {
    if (!createJobOrderMutation.isPending) {
      resetForm();
      onClose();
    }
  };

  const isSubmitting = createJobOrderMutation.isPending || uploadAttachmentMutation.isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden"
        style={{ animation: 'modalFadeIn 0.25s ease-out' }}
      >
        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Create New Job Order</h2>
            <p className="text-xs text-blue-100 mt-0.5">Submit a new IT support request</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-130px)]">
          <div className="p-5 space-y-4">

            {/* Requester Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user?.name?.substring(0, 2).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Requester</p>
                <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Unknown User'}</p>
                <p className="text-xs text-slate-500 truncate">
                  <span className="font-medium">Dept:</span> {user?.department || 'Unknown'}
                </p>
              </div>
              <div className="bg-white rounded-md px-3 py-2 border border-blue-100 text-right">
                <p className="text-[10px] text-slate-400">Work Order No.</p>
                <p className="text-xs font-mono font-bold text-slate-600">Auto-generated</p>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Printer not working on 3rd floor"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the issue in detail..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                disabled={isSubmitting}
              />
            </div>

            {/* Priority & Category */}
            <div className="space-y-4">
              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Priority <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { value: 'low',      icon: '🟢', label: 'Low',      active: 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-300 ring-offset-1'  },
                    { value: 'medium',   icon: '🟡', label: 'Medium',   active: 'border-yellow-500 bg-yellow-50 text-yellow-700 ring-2 ring-yellow-300 ring-offset-1' },
                    { value: 'high',     icon: '🟠', label: 'High',     active: 'border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-300 ring-offset-1' },
                    { value: 'critical', icon: '🔴', label: 'Critical', active: 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-300 ring-offset-1'            },
                  ].map(({ value, icon, label, active }) => (
                    <button
                      key={value}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setFormData({ ...formData, priority: value as TicketPriority })}
                      className={`
                        flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-xs font-semibold transition-all
                        ${formData.priority === value
                          ? active
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      <span className="text-lg leading-none">{icon}</span>
                      <span className="leading-none">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { value: 'Printer',           icon: '🖨️', label: 'Printer'        },
                    { value: 'Report Generation', icon: '📊', label: 'Report Gen'     },
                    { value: 'Database',          icon: '🗄️', label: 'Database'       },
                    { value: 'Access & Security', icon: '🔐', label: 'Access & Sec'   },
                    { value: 'Lan and Networks',  icon: '🌐', label: 'LAN & Networks' },
                    { value: 'Hardware',          icon: '🖥️', label: 'Hardware'       },
                    { value: 'Software',          icon: '💿', label: 'Software'       },
                    { value: 'Others',            icon: '📋', label: 'Others'         },
                  ].map(({ value, icon, label }) => (
                    <button
                      key={value}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setFormData({ ...formData, category: value, type: value.toLowerCase() })}
                      className={`
                        flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-xs font-semibold transition-all
                        ${formData.category === value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-300 ring-offset-1'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      <span className="text-lg leading-none">{icon}</span>
                      <span className="leading-none">{label}</span>
                    </button>
                  ))}
                </div>
                <input type="text" required value={formData.category} onChange={() => {}} className="sr-only" tabIndex={-1} />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tags <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., urgent, wifi, printer-jam"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isSubmitting}
              />
              <p className="text-[10px] text-slate-400 mt-1">🏷️ Comma-separated</p>
            </div>

            {/* ── Attachments ── */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Attachments <span className="text-slate-400 font-normal">(optional)</span>
              </label>

              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isSubmitting && fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-lg px-4 py-5 text-center cursor-pointer transition-all
                  ${isDragging
                    ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                  }
                  ${isSubmitting ? 'pointer-events-none opacity-60' : ''}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                  disabled={isSubmitting}
                />
                <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDragging ? 'bg-blue-100' : 'bg-slate-100'}`}>
                    <svg className={`w-5 h-5 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-600">
                    {isDragging ? 'Drop files here' : 'Click or drag & drop files'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Images, PDF, Word, Excel, ZIP — any size
                  </p>
                </div>
              </div>

              {/* File List */}
              {pendingFiles.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {pendingFiles.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 group"
                    >
                      {/* Preview / Icon */}
                      {entry.previewUrl ? (
                        <img src={entry.previewUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0 border border-slate-200" />
                      ) : (
                        <span className="text-xl flex-shrink-0">{getFileIcon(entry.file.type)}</span>
                      )}

                      {/* Name & Size */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{entry.file.name}</p>
                        <p className="text-[10px] text-slate-400">{formatBytes(entry.file.size)}</p>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeFile(entry.id)}
                        disabled={isSubmitting}
                        className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  <p className="text-[10px] text-slate-400 px-1">
                    📎 {pendingFiles.length} file{pendingFiles.length > 1 ? 's' : ''} selected — uploaded after job order is created
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* ── Upload Progress Banner ── */}
          {uploadProgress && (
            <div className="mx-5 mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <svg className="animate-spin h-3.5 w-3.5 text-blue-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p className="text-xs text-blue-700 font-medium">{uploadProgress}</p>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="px-5 pb-5 flex gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {uploadProgress ? 'Uploading...' : 'Creating...'}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create{pendingFiles.length > 0 ? ` + ${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''}` : ''}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}} />
    </div>
  );
}