import React, { useState } from 'react';
import { X, Upload, Paperclip, Trash2 } from 'lucide-react';
import type { PatientDetails } from '../../../services/patientDetailsTypes';
import * as notebooksApi from '../../../services/notebooksApi';
import { useAuth } from '../../../hooks/useAuth'; // 🆕 USE EXISTING AUTH HOOK

interface AddNotebookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    patient: PatientDetails | null;
}

interface AttachmentFile {
    id: string;
    file: File;
    preview?: string;
}

export const AddNotebookModal: React.FC<AddNotebookModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    patient
}) => {
    const { user } = useAuth(); // 🆕 Get user from existing auth hook
    const [notes, setNotes] = useState('');
    const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        const newAttachments: AttachmentFile[] = Array.from(files).map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        }));

        setAttachments(prev => [...prev, ...newAttachments]);
        event.target.value = ''; // Reset input
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => {
            const attachment = prev.find(a => a.id === id);
            if (attachment?.preview) {
                URL.revokeObjectURL(attachment.preview);
            }
            return prev.filter(a => a.id !== id);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!notes.trim()) {
            setError('Notes field is required');
            return;
        }

        if (!patient) {
            setError('Patient information is missing');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('📝 Submitting notebook entry...');
            console.log('👤 Current user:', user?.name); // 🆕 Log actual user name
            
            // 🆕 Use actual logged-in user's name from auth
            const result = await notebooksApi.addNotebookEntry(
                patient.labno,
                patient.labid || '',
                patient.fname,
                patient.lname,
                notes.trim(),
                attachments.map(a => a.file),
                user?.name || user?.email || 'SYSTEM' // 🆕 Use user.name from auth
            );

            console.log('✅ Notebook entry added:', result);

            // Success - reset and close
            setNotes('');
            setAttachments([]);
            onSuccess(); // Refresh the notebook list
            onClose();

        } catch (err) {
            console.error('❌ Error adding notebook:', err);
            setError(err instanceof Error ? err.message : 'Failed to add notebook entry');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        // Cleanup preview URLs
        attachments.forEach(attachment => {
            if (attachment.preview) {
                URL.revokeObjectURL(attachment.preview);
            }
        });
        setNotes('');
        setAttachments([]);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-[60]" onClick={handleClose}></div>

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-blue-600 dark:bg-blue-700 rounded-t-lg">
                        <h3 className="text-base font-semibold text-white flex items-center gap-2">
                            <span>📝</span> Add Notebook Entry
                        </h3>
                        <button
                            onClick={handleClose}
                            className="p-1 hover:bg-blue-500 dark:hover:bg-blue-600 rounded transition-colors"
                            disabled={loading}
                        >
                            <X size={20} className="text-white" />
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4">
                        {/* Patient Info */}
                        {patient && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
                                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Patient Information
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <span className="text-gray-600 dark:text-gray-400">Name:</span>
                                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                            {patient.fname} {patient.lname}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 dark:text-gray-400">Lab No:</span>
                                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                            {patient.labno}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 🆕 User Info Display - Using Auth User */}
                        {user && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 mb-4 flex items-center gap-2">
                                <span className="text-xs text-blue-700 dark:text-blue-300">
                                    👤 Logged in as: <strong>{user.name || user.email}</strong>
                                </span>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                            </div>
                        )}

                        {/* Notes Field */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Notes <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={6}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                         disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="Enter your notes here..."
                                disabled={loading}
                                required
                            />
                        </div>

                        {/* Attachments Section */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Attachments (Optional)
                            </label>
                            
                            {/* File Input */}
                            <div className="mb-3">
                                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed 
                                              border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer
                                              hover:border-blue-400 dark:hover:border-blue-500 transition-colors
                                              bg-gray-50 dark:bg-gray-800">
                                    <Upload size={20} className="text-gray-500 dark:text-gray-400" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Click to upload files (PDF, Images, Docs)
                                    </span>
                                    <input
                                        type="file"
                                        onChange={handleFileSelect}
                                        multiple
                                        accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt"
                                        className="hidden"
                                        disabled={loading}
                                    />
                                </label>
                            </div>

                            {/* Attachment List */}
                            {attachments.length > 0 && (
                                <div className="space-y-2">
                                    {attachments.map(attachment => (
                                        <div
                                            key={attachment.id}
                                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 
                                                     rounded-lg border border-gray-200 dark:border-gray-700"
                                        >
                                            {/* File Icon or Preview */}
                                            {attachment.preview ? (
                                                <img
                                                    src={attachment.preview}
                                                    alt={attachment.file.name}
                                                    className="w-12 h-12 object-cover rounded"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded">
                                                    <Paperclip size={20} className="text-gray-500 dark:text-gray-400" />
                                                </div>
                                            )}

                                            {/* File Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {attachment.file.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatFileSize(attachment.file.size)}
                                                </p>
                                            </div>

                                            {/* Remove Button */}
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(attachment.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 
                                                         rounded transition-colors"
                                                disabled={loading}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                                     bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                                     rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 
                                     rounded-lg hover:bg-blue-700 transition-colors
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     flex items-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <span>💾</span>
                                    Save Entry
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};