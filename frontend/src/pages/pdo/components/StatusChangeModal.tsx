interface StatusChangeModalProps {
  show: boolean;
  caseNo: string;
  onClose: () => void;
  onStatusChange: (status: "open" | "closed" | "pending") => void;
}

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  show,
  caseNo,
  onClose,
  onStatusChange,
}) => {
  if (!show) return null;

  const handleClick = (status: "open" | "closed" | "pending") => {
    onStatusChange(status);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
          Change Status
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Case: <strong>{caseNo || "-"}</strong>
        </p>

        <div className="space-y-3">
          <button
            onClick={() => handleClick("open")}
            className="w-full py-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
          >
            Open
          </button>

          <button
            onClick={() => handleClick("closed")}
            className="w-full py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600"
          >
            Closed
          </button>

          <button
            onClick={() => handleClick("pending")}
            className="w-full py-2 rounded-lg bg-yellow-500 text-black hover:bg-yellow-600"
          >
            Pending
          </button>
        </div>
      </div>
    </div>
  );
};
