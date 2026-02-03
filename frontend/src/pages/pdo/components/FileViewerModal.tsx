import React from "react";

interface FileViewerModalProps {
  show: boolean;
  fileUrl: string;
  caseNo: string;
  onClose: () => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  show,
  fileUrl,
  caseNo,
  onClose,
}) => {
  if (!show) return null;

  // Determine file type from URL
  const getFileType = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension || '')) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'pdf';
    } else {
      return 'other';
    }
  };

  const fileType = getFileType(fileUrl);
  const fileName = fileUrl.split('/').pop() || 'file';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl max-h-[90vh] mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              File Viewer - {caseNo}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {fileName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              download
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Download
            </a>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Open in New Tab
            </a>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
          {fileType === 'image' ? (
            <div className="flex items-center justify-center min-h-full">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : fileType === 'pdf' ? (
            <iframe
              src={fileUrl}
              title={fileName}
              className="w-full h-full min-h-[600px] rounded-lg shadow-lg"
            />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="w-20 h-20 mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Preview Not Available
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This file type cannot be previewed in the browser.
              </p>
              <div className="flex gap-3">
                <a
                  href={fileUrl}
                  download
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Download File
                </a>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Open in New Tab
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};