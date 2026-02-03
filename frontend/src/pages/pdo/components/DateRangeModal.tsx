import React, { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (from: string, to: string) => void;
}

/**
 * Convert Date → datetime-local string
 * YYYY-MM-DDTHH:mm
 */
const toInputValue = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

/**
 * Convert datetime-local → Oracle format
 * YYYY-MM-DD HH:mm:ss
 */
const toOracleDateTime = (value: string, endOfDay = false) => {
  if (!value) return "";
  return value.replace("T", " ") + (endOfDay ? ":59" : ":00");
};

export const DateRangeModal: React.FC<Props> = ({
  open,
  onClose,
  onApply,
}) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  /**
   * Set default = current month when modal opens
   */
  useEffect(() => {
    if (!open) return;

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0);
    const lastDay = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59
    );

    setFrom(toInputValue(firstDay));
    setTo(toInputValue(lastDay));
  }, [open]);

  if (!open) return null;

  const handleApply = () => {
    if (!from || !to) return;

    onApply(
      toOracleDateTime(from),
      toOracleDateTime(to, true)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-900 shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b dark:border-gray-700">
          <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Select Date & Time Range
          </h5>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400">
              Date & Time From
            </label>
            <input
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full mt-1 h-9 rounded-lg border px-2 text-sm
                bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400">
              Date & Time To
            </label>
            <input
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full mt-1 h-9 rounded-lg border px-2 text-sm
                bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded-lg bg-gray-300 dark:bg-gray-700
              text-gray-800 dark:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!from || !to}
            className="px-3 py-1.5 text-xs rounded-lg bg-blue-600
              text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
