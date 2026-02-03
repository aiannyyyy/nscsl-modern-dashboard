import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';

interface ViewImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    labno: string;
}

export const ViewImageModal: React.FC<ViewImageModalProps> = ({
    isOpen,
    onClose,
    labno
}) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

    useEffect(() => {
        if (isOpen && labno) {
            fetchImage();
        }
        
        // Cleanup function
        return () => {
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [isOpen, labno]);

    const fetchImage = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/notebooks/fetch-image?labno=${labno}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Filter card image not found for this specimen');
                }
                throw new Error('Failed to load image');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setImageUrl(url);
        } catch (err) {
            console.error('Error fetching image:', err);
            setError(err instanceof Error ? err.message : 'Failed to load image');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/70 z-[70]" onClick={onClose}></div>

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-blue-600 dark:bg-blue-700 rounded-t-lg">
                        <h3 className="text-base font-semibold text-white flex items-center gap-2">
                            <span>🔍</span> Filter Card Image - {labno}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-blue-500 dark:hover:bg-blue-600 rounded transition-colors"
                        >
                            <X size={20} className="text-white" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-800">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-96">
                                <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
                                <p className="text-sm text-gray-600 dark:text-gray-400">Loading filter card image...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-96">
                                <AlertCircle size={48} className="text-red-500 mb-4" />
                                <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>
                                <button
                                    onClick={fetchImage}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : imageUrl ? (
                            <div className="flex items-center justify-center">
                                <img
                                    src={imageUrl}
                                    alt={`Filter card for ${labno}`}
                                    className="max-w-full max-h-[calc(90vh-8rem)] object-contain rounded shadow-lg"
                                />
                            </div>
                        ) : null}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};