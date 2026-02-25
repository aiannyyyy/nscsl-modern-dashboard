import React, { useState } from 'react';
import { Search, ChevronDown, X, ChevronLeft, ChevronRight, User, FlaskConical } from 'lucide-react';


// ==================== TYPES ====================

export interface SearchParams {
  lastName: string;
  firstName: string;
  patientNumber: string;
  formNumber: string;
  birthDate: string;
  collectionHospitalId: string;
  dateCollection: string;
  sex: string;
  labNumber: string;
  physicianId: string;
  dateReceived: string;
  outsideLab: string;
  contactLastName: string;
  contactFirstName: string;
  dateReported: string;
}

export interface SampleRecord {
  LABNO: string;
  LABID: string;
  LNAME: string;
  FNAME: string;
  SUBMID: string;
  BIRTHDT: string;
  BIRTHTM: string;
  DTCOLL: string;
  TMCOLL: string;
  DTRECV: string;
  TMRECV: string;
  DTRPTD: string;
  GESTAGE: string;
  AGECOLL: string;
  SEX: string;
}

interface Props {
  onSearch: (params: SearchParams) => void;
  results: SampleRecord[];
  isLoading: boolean;
  totalCount: number;
}

// ==================== CONFIG ====================

const SEX_OPTIONS         = ['', '1', '2', 'A', 'M', 'F'];
const OUTSIDE_LAB_OPTIONS = ['', '1', '2', '3', '4', '5', '6'];
const PAGE_SIZE           = 50;

const EMPTY_PARAMS: SearchParams = {
  lastName: '', firstName: '', patientNumber: '', formNumber: '',
  birthDate: '', collectionHospitalId: '', dateCollection: '', sex: '',
  labNumber: '', physicianId: '', dateReceived: '', outsideLab: '',
  contactLastName: '', contactFirstName: '', dateReported: '',
};

// ==================== HELPERS ====================

const formatSex = (sex: string): { label: string; color: string } => {
  switch (sex?.toUpperCase()) {
    case '1':
    case 'M': return { label: 'Male',   color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700' };
    case '2':
    case 'F': return { label: 'Female', color: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-700' };
    case 'A': return { label: 'Ambig.', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700' };
    default:  return { label: sex || '—', color: 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' };
  }
};

const formatSexLabel = (sex: string): string => {
  switch (sex?.toUpperCase()) {
    case '1': case 'M': return 'Male';
    case '2': case 'F': return 'Female';
    case 'A':           return 'Ambiguous';
    default:            return sex || '—';
  }
};

const formatDateTime = (date: string, time?: string): React.ReactNode => {
  if (!date) return <span className="text-gray-300 dark:text-gray-600">—</span>;

  let formattedTime = '';
  const t = time?.trim();

  if (t) {
    const digits = t.replace(/:/g, '');
    if (digits.length >= 4) {
      const hh     = parseInt(digits.slice(0, 2), 10);
      const mm     = digits.slice(2, 4);
      const period = hh >= 12 ? 'PM' : 'AM';
      const hour12 = hh % 12 === 0 ? 12 : hh % 12;
      formattedTime = `${String(hour12).padStart(2, '0')}:${mm} ${period}`;
    } else {
      formattedTime = t;
    }
  }

  return (
    <div className="flex flex-col leading-tight">
      <span className="font-medium text-gray-800 dark:text-gray-200">{date}</span>
      {formattedTime && (
        <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">{formattedTime}</span>
      )}
    </div>
  );
};

const formatName = (lname: string, fname: string): React.ReactNode => {
  if (!lname && !fname) return <span className="text-gray-300 dark:text-gray-600">—</span>;
  return (
    <div className="flex flex-col leading-tight">
      <span className="font-semibold text-gray-900 dark:text-gray-100">{lname || ''}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400">{fname || ''}</span>
    </div>
  );
};

const val = (v?: string | null) => v?.trim() || '—';

// ==================== MODAL SUB-COMPONENTS ====================

const InfoField: React.FC<{
  label: string;
  value?: string | null;
  mono?: boolean;
  highlight?: boolean;
}> = ({ label, value, mono = false, highlight = false }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-400">
      {label}
    </span>
    <span className={`text-sm ${mono ? 'font-mono' : 'font-medium'} ${
      highlight
        ? 'text-blue-600 dark:text-blue-400 font-semibold'
        : 'text-gray-800 dark:text-gray-100'
    } ${!value || value === '—' ? 'text-gray-300 dark:text-gray-600' : ''}`}>
      {val(value)}
    </span>
  </div>
);

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
      {icon}
    </div>
    <h3 className="text-xs font-bold uppercase tracking-widest text-blue-500">{title}</h3>
    <div className="flex-1 h-px bg-blue-100 dark:bg-blue-800/40" />
  </div>
);

// ==================== PATIENT RECORD MODAL ====================

const PatientRecordModal: React.FC<{
  record: SampleRecord | null;
  onClose: () => void;
}> = ({ record, onClose }) => {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!record) return null;

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const fullName = [record.LNAME, record.FNAME].filter(Boolean).join(', ') || '—';

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-blue-100 dark:border-blue-900/50"
        style={{ animation: 'pisModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">{fullName}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-blue-200 text-xs font-mono">{val(record.LABNO)}</span>
                <span className="w-1 h-1 rounded-full bg-blue-300" />
                <span className="text-blue-200 text-xs">Lab ID: {val(record.LABID)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Patient Information */}
          <section>
            <SectionHeader icon={<User size={14} />} title="Patient Information" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
              <InfoField label="Last Name"         value={record.LNAME} />
              <InfoField label="First Name"        value={record.FNAME} />
              <InfoField label="Sex"               value={formatSexLabel(record.SEX)} />
              <InfoField label="Birth Date"        value={record.BIRTHDT} />
              <InfoField label="Birth Time"        value={record.BIRTHTM} mono />
              <InfoField label="Gestational Age"   value={record.GESTAGE ? `${record.GESTAGE} weeks` : undefined} />
              <InfoField label="Age at Collection" value={record.AGECOLL ? `${record.AGECOLL} day(s)` : undefined} />
            </div>
          </section>

          {/* Sample & Lab Details */}
          <section>
            <SectionHeader icon={<FlaskConical size={14} />} title="Sample & Lab Details" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
              <InfoField label="Lab Number"    value={record.LABNO}  mono highlight />
              <InfoField label="Lab ID"        value={record.LABID}  mono />
              <InfoField label="Facility Code" value={record.SUBMID} mono />
              <div />
              <InfoField label="Date Collected" value={record.DTCOLL} />
              <InfoField label="Time Collected" value={record.TMCOLL} mono />
              <InfoField label="Date Received"  value={record.DTRECV} />
              <InfoField label="Time Received"  value={record.TMRECV} mono />
              <InfoField label="Date Reported"  value={record.DTRPTD} />
            </div>
          </section>

        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between flex-shrink-0 bg-gray-50 dark:bg-gray-900/60">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Record: <span className="font-mono text-gray-500 dark:text-gray-400">{val(record.LABNO)}</span>
          </span>
          <button
            onClick={onClose}
            className="h-8 px-4 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pisModalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}} />
    </div>
  );
};

// ==================== SEARCH FORM SUB-COMPONENTS ====================

const Field: React.FC<{
  label: string;
  name: keyof SearchParams;
  value: string;
  onChange: (name: keyof SearchParams, value: string) => void;
  type?: string;
  disabled?: boolean;
}> = ({ label, name, value, onChange, type = 'text', disabled = false }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(name, e.target.value)}
      disabled={disabled}
      className="h-9 px-3 text-sm rounded-lg border
        border-gray-300 dark:border-gray-700
        bg-white dark:bg-gray-800
        text-gray-900 dark:text-gray-100
        placeholder-gray-400 dark:placeholder-gray-500
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800/50"
    />
  </div>
);

const SelectField: React.FC<{
  label: string;
  name: keyof SearchParams;
  value: string;
  options: string[];
  onChange: (name: keyof SearchParams, value: string) => void;
}> = ({ label, name, value, options, onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className="h-9 w-full px-3 pr-8 text-sm rounded-lg border appearance-none
          border-gray-300 dark:border-gray-700
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-150"
      >
        {options.map(o => (
          <option key={o} value={o} className="bg-white dark:bg-gray-800">
            {o === '' ? '— All —' : o}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

// ==================== SEARCH FORM ====================

const SearchForm: React.FC<{
  params: SearchParams;
  onChange: (name: keyof SearchParams, value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  isLoading: boolean;
}> = ({ params, onChange, onSearch, onClear, isLoading }) => {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div
      onKeyDown={handleKey}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm"
    >
      <div className="grid grid-cols-4 gap-4 mb-4">
        <Field label="Last Name"              name="lastName"             value={params.lastName}              onChange={onChange} />
        <Field label="First Name"             name="firstName"            value={params.firstName}             onChange={onChange} />
        <Field label="Patient Number"         name="patientNumber"        value={params.patientNumber}         onChange={onChange} disabled />
        <Field label="Form Number"            name="formNumber"           value={params.formNumber}            onChange={onChange} />
      </div>
      <div className="grid grid-cols-4 gap-4 mb-4">
        <Field label="Birth Date"             name="birthDate"            value={params.birthDate}             onChange={onChange} type="date" />
        <Field label="Collection Hospital ID" name="collectionHospitalId" value={params.collectionHospitalId}  onChange={onChange} />
        <Field label="Date Collection"        name="dateCollection"       value={params.dateCollection}        onChange={onChange} type="date" />
        <SelectField label="Sex"              name="sex"                  value={params.sex}                   options={SEX_OPTIONS} onChange={onChange} />
      </div>
      <div className="grid grid-cols-4 gap-4 mb-4">
        <Field label="Lab Number"             name="labNumber"            value={params.labNumber}             onChange={onChange} />
        <Field label="Physician ID"           name="physicianId"          value={params.physicianId}           onChange={onChange} />
        <Field label="Date Received"          name="dateReceived"         value={params.dateReceived}          onChange={onChange} type="date" />
        <SelectField label="Outside Lab"      name="outsideLab"           value={params.outsideLab}            options={OUTSIDE_LAB_OPTIONS} onChange={onChange} />
      </div>
      <div className="grid grid-cols-4 gap-4 mb-5">
        <Field label="Contact's Last Name"    name="contactLastName"      value={params.contactLastName}       onChange={onChange} disabled />
        <Field label="Contact's First Name"   name="contactFirstName"     value={params.contactFirstName}      onChange={onChange} disabled />
        <Field label="Date Reported"          name="dateReported"         value={params.dateReported}          onChange={onChange} type="date" />
        <div />
      </div>
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onClear}
          className="h-9 px-4 text-sm rounded-lg border
            border-gray-300 dark:border-gray-600
            text-gray-600 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-700
            flex items-center gap-2 transition-all duration-150"
        >
          <X size={14} />
          Clear
        </button>
        <button
          onClick={onSearch}
          disabled={isLoading}
          className="h-9 px-5 text-sm rounded-lg font-semibold
            bg-blue-600 hover:bg-blue-500 text-white
            shadow-lg shadow-blue-600/20
            flex items-center gap-2 transition-all duration-150
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search size={14} />
          {isLoading ? 'Searching…' : 'Search'}
        </button>
      </div>
    </div>
  );
};

// ==================== PAGINATION ====================

const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, totalCount, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to   = Math.min(currentPage * pageSize, totalCount);

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{from}–{to}</span> of{' '}
        <span className="font-semibold text-gray-700 dark:text-gray-300">{totalCount}</span> records
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 flex items-center justify-center rounded-lg border
            border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-700
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="h-8 w-8 flex items-center justify-center text-xs text-gray-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`h-8 w-8 flex items-center justify-center rounded-lg border text-xs font-medium transition-colors
                ${p === currentPage
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 flex items-center justify-center rounded-lg border
            border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-700
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

// ==================== RESULTS TABLE ====================

const ResultsTable: React.FC<{
  results: SampleRecord[];
  totalCount: number;
  isLoading: boolean;
  onView: (record: SampleRecord) => void;
}> = ({ results = [], totalCount = 0, isLoading, onView }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages    = Math.ceil(results.length / PAGE_SIZE);
  const paginatedRows = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  React.useEffect(() => { setCurrentPage(1); }, [results]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-4">
      {totalCount > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Search Results
          </span>
          <span className="px-2 py-0.5 text-xs font-bold rounded-full
            bg-blue-50 dark:bg-blue-600/20
            text-blue-600 dark:text-blue-400
            border border-blue-200 dark:border-blue-500/30">
            {totalCount} record{totalCount !== 1 ? 's' : ''} found
          </span>
        </div>
      )}

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
          <Search size={32} className="mb-3 opacity-30" />
          <p className="text-sm">No records found. Try adjusting your search filters.</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border overflow-hidden shadow-sm border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-gray-500 dark:text-gray-400">Lab No</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-gray-500 dark:text-gray-400">Lab ID</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-gray-500 dark:text-gray-400">Patient Name</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-gray-500 dark:text-gray-400">Facility Code</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-gray-500 dark:text-gray-400">Birth Date</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-gray-500 dark:text-gray-400">Date Coll.</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-gray-500 dark:text-gray-400">Date Recv.</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-gray-500 dark:text-gray-400">Date Rptd.</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-gray-500 dark:text-gray-400">Gest. Age</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-gray-500 dark:text-gray-400">Age Coll.</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-gray-500 dark:text-gray-400">Sex</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-gray-500 dark:text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row, i) => {
                    const sex = formatSex(row.SEX);
                    return (
                      <tr
                        key={`${row.LABNO}-${i}`}
                        className={`border-b transition-colors duration-100
                          border-gray-100 dark:border-gray-700/50
                          ${i % 2 === 0
                            ? 'bg-white dark:bg-gray-900'
                            : 'bg-gray-50/50 dark:bg-gray-800/40'}
                          hover:bg-blue-50/50 dark:hover:bg-gray-700/50`}
                      >
                        {/* Lab No */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-tight">
                            {row.LABNO || '—'}
                          </span>
                        </td>

                        {/* Lab ID */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                            {row.LABID || '—'}
                          </span>
                        </td>

                        {/* Patient Name */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                              <User size={13} className="text-blue-500 dark:text-blue-400" />
                            </div>
                            {formatName(row.LNAME, row.FNAME)}
                          </div>
                        </td>

                        {/* Facility Code */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {row.SUBMID ? (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded
                              bg-gray-100 dark:bg-gray-700/60
                              text-gray-700 dark:text-gray-300
                              border border-gray-200 dark:border-gray-600
                              font-mono tracking-wide">
                              {row.SUBMID}
                            </span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>

                        {/* Birth Date + Time */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {formatDateTime(row.BIRTHDT, row.BIRTHTM)}
                        </td>

                        {/* Date Collected + Time */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {formatDateTime(row.DTCOLL, row.TMCOLL)}
                        </td>

                        {/* Date Received + Time */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {formatDateTime(row.DTRECV, row.TMRECV)}
                        </td>

                        {/* Date Reported */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {formatDateTime(row.DTRPTD)}
                        </td>

                        {/* Gestational Age */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                          {row.GESTAGE
                            ? <span className="font-semibold text-gray-700 dark:text-gray-300">{row.GESTAGE}</span>
                            : <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </td>

                        {/* Age at Collection */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                          {row.AGECOLL
                            ? <span className="font-semibold text-gray-700 dark:text-gray-300">{row.AGECOLL}</span>
                            : <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </td>

                        {/* Sex */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${sex.color}`}>
                            {sex.label}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => onView(row)}
                            className="h-7 px-3 text-xs rounded-lg font-medium
                              bg-blue-50 dark:bg-blue-600/20
                              hover:bg-blue-100 dark:hover:bg-blue-600/40
                              text-blue-600 dark:text-blue-400
                              border border-blue-200 dark:border-blue-500/30
                              hover:border-blue-300 dark:hover:border-blue-400/60
                              flex items-center gap-1.5 transition-all duration-150"
                          >
                            <Search size={11} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={results.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

// ==================== PARENT COMPONENT ====================

export const PatientInformationSystem: React.FC<Props> = ({
  onSearch,
  results = [],
  isLoading,
  totalCount,
}) => {
  const [params,     setParams]     = useState<SearchParams>(EMPTY_PARAMS);
  const [viewRecord, setViewRecord] = useState<SampleRecord | null>(null);

  const handleChange = (name: keyof SearchParams, value: string) => {
    setParams(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => onSearch(params);
  const handleClear  = () => setParams(EMPTY_PARAMS);
  const handleView   = (record: SampleRecord) => setViewRecord(record);

  return (
    <div className="p-6 text-gray-900 dark:text-gray-100">
      <div className="mb-5 flex items-center gap-3">
        <div className="w-1 h-8 rounded-full bg-blue-500" />
        <div>
          <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
            Patient Information System
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Search and manage patient sample records
          </p>
        </div>
      </div>

      <SearchForm
        params={params}
        onChange={handleChange}
        onSearch={handleSearch}
        onClear={handleClear}
        isLoading={isLoading}
      />

      <ResultsTable
        results={results}
        totalCount={totalCount}
        isLoading={isLoading}
        onView={handleView}
      />

      {/* ── Patient Record Modal ── */}
      <PatientRecordModal
        record={viewRecord}
        onClose={() => setViewRecord(null)}
      />
    </div>
  );
};

export default PatientInformationSystem;