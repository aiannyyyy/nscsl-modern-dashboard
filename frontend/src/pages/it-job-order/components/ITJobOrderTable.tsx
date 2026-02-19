import React, { useState, useMemo, useEffect } from "react";
import { Download, Filter, X, Calendar, Loader2, ClipboardList } from "lucide-react";
import { useJobOrders, useDeleteJobOrder } from "../../../hooks/ITHooks/useJobOrderHooks";
import type { JobOrder, JobOrderFilters } from "../../../services/ITServices/itJobOrderService";

// ─── Debounce Hook ────────────────────────────────────────────────────────────
// Keeps the text input value local — only sends to the API after the user
// stops typing for 400 ms, so the input never gets wiped on refetch.

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending_approval: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved:         "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  queued:           "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  assigned:         "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  in_progress:      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  on_hold:          "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  resolved:         "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  closed:           "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  cancelled:        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  rejected:         "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  high:     "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  medium:   "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  low:      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

const STATUS_LABELS: Record<string, string> = {
  pending_approval: "Pending Approval",
  approved:         "Approved",
  queued:           "Queued",
  assigned:         "Assigned",
  in_progress:      "In Progress",
  on_hold:          "On Hold",
  resolved:         "Resolved",
  closed:           "Closed",
  cancelled:        "Cancelled",
  rejected:         "Rejected",
};

const ALL_STATUSES = Object.keys(STATUS_LABELS);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateString?: string | null) => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
};

const formatDateTime = (dateString?: string | null) => {
  if (!dateString) return null;
  const d = new Date(dateString);
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  };
};

// ─── Stacked Cell ─────────────────────────────────────────────────────────────

interface StackedCellProps {
  name?: string | null;
  dateString?: string | null;
  emptyLabel?: string;
}

const StackedCell: React.FC<StackedCellProps> = ({ name, dateString, emptyLabel = "—" }) => {
  const dt = formatDateTime(dateString);

  if (!name && !dt) {
    return <span className="text-gray-400 dark:text-gray-600">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {name && (
        <span className="text-xs font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
          {name}
        </span>
      )}
      {dt && (
        <span className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {dt.date} · {dt.time}
        </span>
      )}
    </div>
  );
};

// ─── Date Range Modal ─────────────────────────────────────────────────────────

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (from: string, to: string) => void;
}

const DateRangeModal: React.FC<DateRangeModalProps> = ({ isOpen, onClose, onApply }) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl shadow-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Select Date Range</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white dark:hover:bg-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">From Date</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">To Date</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { if (from && to) { onApply(from, to); onClose(); } }}
            disabled={!from || !to}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface ITJobOrderTableProps {
  onView?: (record: JobOrder) => void;
  onEdit?: (record: JobOrder) => void;
}

export const ITJobOrderTable: React.FC<ITJobOrderTableProps> = ({ onView, onEdit }) => {
  // ── Local UI state (never tied directly to API params) ──
  const [searchInput, setSearchInput] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);

  // ── Debounced search — only sent to API 400ms after user stops typing ──
  const debouncedSearch = useDebounce(searchInput, 400);

  // ── API filters — status & search go server-side, category stays client-side ──
  const filters: JobOrderFilters = {
    limit: 500,
    sort_by: "created_at",
    sort_order: "DESC",
    ...(selectedStatus !== "all" && { status: selectedStatus }),
    ...(debouncedSearch && { search: debouncedSearch }),
  };

  const { data, isLoading } = useJobOrders(filters);
  const deleteMutation = useDeleteJobOrder();

  const allRecords = data?.data ?? [];

  // Category filter is client-side only (derived from whatever the API returns)
  const uniqueCategories = useMemo(() => {
    const cats = new Set(allRecords.map((r) => r.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [allRecords]);

  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => selectedCategory === "all" || r.category === selectedCategory);
  }, [allRecords, selectedCategory]);

  const hasActiveFilters = searchInput !== "" || selectedStatus !== "all" || selectedCategory !== "all";

  const handleClearFilters = () => {
    setSearchInput("");
    setSelectedStatus("all");
    setSelectedCategory("all");
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this job order?")) return;
    deleteMutation.mutate(id);
  };

  const handleExport = (from: string, to: string) => {
    const filtered = allRecords.filter((r) => {
      const d = new Date(r.created_at);
      return d >= new Date(from) && d <= new Date(to);
    });

    if (filtered.length === 0) {
      alert("No records found in the selected date range.");
      return;
    }

    import("xlsx").then((XLSX) => {
      const exportData = filtered.map((r) => ({
        "Work Order No":  r.work_order_no,
        Title:            r.title,
        Category:         r.category || "—",
        Type:             r.type || "—",
        Priority:         r.priority,
        Status:           STATUS_LABELS[r.status] ?? r.status,
        Department:       r.department,
        Location:         r.location || "—",
        "Requested By":   r.requester_name || "—",
        "Date Requested": formatDate(r.created_at) ?? "—",
        "Approved By":    r.approved_by_name || "—",
        "Date Approved":  formatDate(r.approved_at) ?? "—",
        "Assigned To":    r.tech_name || "Unassigned",
        "Date Assigned":  formatDate(r.assigned_at) ?? "—",
        "Resolved By":    r.resolved_at ? (r.tech_name || "—") : "—",
        "Date Resolved":  formatDate(r.resolved_at) ?? "—",
        "Date Closed":    formatDate(r.closed_at) ?? "—",
        "Date Due":       formatDate(r.due_date) ?? "—",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws["!cols"] = [
        { wch: 18 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 10 },
        { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
        { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
        { wch: 20 }, { wch: 18 }, { wch: 15 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Work Orders");
      XLSX.writeFile(wb, `WorkOrders_${from}_to_${to}.xlsx`);
    });
  };

  if (isLoading && allRecords.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 h-[500px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading work orders...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 h-[500px] flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0 rounded-t-2xl">
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <ClipboardList size={16} className="text-blue-500" />
              Work Orders
              {hasActiveFilters && (
                <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                  ({filteredRecords.length} of {allRecords.length})
                </span>
              )}
              {/* Subtle loading indicator on background refetch */}
              {isLoading && allRecords.length > 0 && (
                <Loader2 size={12} className="animate-spin text-blue-400 ml-1" />
              )}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <Filter size={13} />
              <span className="font-medium">Filters:</span>
            </div>

            {/* Search — controlled by searchInput, NOT debouncedSearch */}
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search orders..."
              className="h-8 px-3 text-xs rounded-lg border w-44 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8 px-2 text-xs rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 px-2 text-xs rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="h-8 px-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                Clear
              </button>
            )}

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

            <button
              onClick={() => setShowDateRangeModal(true)}
              className="h-8 px-3 text-xs rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-1.5 transition-colors"
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 p-4">
          <div className="h-full border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto h-full">
              <table className="w-full text-xs relative">
                <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    {[
                      { label: "Work Order No", cls: "w-36 text-left" },
                      { label: "Title",          cls: "w-48 text-left" },
                      { label: "Category",       cls: "w-32 text-left" },
                      { label: "Department",     cls: "w-28 text-left" },
                      { label: "Priority",       cls: "w-20 text-center" },
                      { label: "Status",         cls: "w-32 text-center" },
                      { label: "Requested By",   cls: "w-44 text-left" },
                      { label: "Approved By",    cls: "w-44 text-left" },
                      { label: "Assigned To",    cls: "w-44 text-left" },
                      { label: "Resolved By",    cls: "w-44 text-left" },
                    ].map(({ label, cls }) => (
                      <th key={label} className={`px-3 py-2 text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap ${cls}`}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-3 py-10 text-center text-xs text-gray-500 dark:text-gray-400">
                        {hasActiveFilters ? "No work orders match the current filters." : "No work orders found."}
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record, index) => (
                      <tr
                        key={record.id}
                        className={`transition-colors ${
                          index % 2 === 0
                            ? "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            : "bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                        }`}
                      >
                        <td className="px-3 py-2.5 whitespace-nowrap font-mono text-blue-600 dark:text-blue-400 font-medium text-xs">
                          {record.work_order_no}
                        </td>
                        <td className="px-3 py-2.5 text-gray-900 dark:text-gray-200 max-w-[192px]">
                          <div className="truncate text-xs" title={record.title}>{record.title}</div>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                          {record.category || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                          {record.department}
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${PRIORITY_STYLES[record.priority] ?? "bg-gray-100 text-gray-800"}`}>
                            {record.priority}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLES[record.status] ?? "bg-gray-100 text-gray-800"}`}>
                            {STATUS_LABELS[record.status] ?? record.status}
                          </span>
                        </td>

                        {/* Requested By — requester name + created_at */}
                        <td className="px-3 py-2.5">
                          <StackedCell name={record.requester_name} dateString={record.created_at} />
                        </td>

                        {/* Approved By — approver name + approved_at */}
                        <td className="px-3 py-2.5">
                          <StackedCell name={record.approved_by_name} dateString={record.approved_at} />
                        </td>

                        {/* Assigned To — tech name + assigned_at */}
                        <td className="px-3 py-2.5">
                          <StackedCell
                            name={record.tech_name ?? (record.assigned_at ? undefined : null)}
                            dateString={record.assigned_at}
                            emptyLabel="Unassigned"
                          />
                        </td>

                        {/* Resolved By — tech (troubleshooter) + resolved_at */}
                        <td className="px-3 py-2.5">
                          <StackedCell
                            name={record.resolved_at ? record.tech_name : null}
                            dateString={record.resolved_at}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <DateRangeModal
        isOpen={showDateRangeModal}
        onClose={() => setShowDateRangeModal(false)}
        onApply={handleExport}
      />
    </>
  );
};